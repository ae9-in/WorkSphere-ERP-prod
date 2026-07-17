from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, date
import uuid
from typing import List, Dict, Any

from app.models.project import Project, Task, Subtask, TaskDependency, Timesheet, Milestone, ProjectRisk
from app.models.employee import Employee
from app.schemas.project import (
    ProjectCreateSchema, TaskCreateSchema, TimesheetCreateSchema, MilestoneCreateSchema, RiskCreateSchema
)

class ProjectService:

    @staticmethod
    def create_project(db: Session, payload: ProjectCreateSchema, tenant_id: uuid.UUID) -> dict:
        mgr_id = uuid.UUID(payload.managerId) if payload.managerId else None
        members_uuids = [payload.managerId] if payload.managerId else []
        if payload.members:
            for m in payload.members:
                if m not in members_uuids:
                    members_uuids.append(m)

        project = Project(
            tenant_id=tenant_id,
            project_code=payload.projectCode,
            name=payload.name,
            client=payload.client,
            department=payload.department,
            budget=payload.budget or 0.0,
            start_date=datetime.strptime(payload.startDate, "%Y-%m-%d").date(),
            end_date=datetime.strptime(payload.endDate, "%Y-%m-%d").date() if payload.endDate else None,
            priority=payload.priority or "medium",
            status=payload.status or "active",
            description=payload.description,
            manager_id=mgr_id,
            members=members_uuids
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return ProjectService._serialize_project(project, db)

    @staticmethod
    def list_projects(db: Session, tenant_id: uuid.UUID) -> list:
        projects = db.query(Project).filter(Project.tenant_id == tenant_id).all()
        return [ProjectService._serialize_project(p, db) for p in projects]

    @staticmethod
    def get_project(db: Session, project_id: str, tenant_id: uuid.UUID) -> dict:
        p_uuid = uuid.UUID(project_id)
        project = db.query(Project).filter(Project.id == p_uuid, Project.tenant_id == tenant_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return ProjectService._serialize_project(project, db)

    @staticmethod
    def create_task(db: Session, payload: TaskCreateSchema, tenant_id: uuid.UUID) -> dict:
        proj_uuid = uuid.UUID(payload.projectId)
        assignee_uuid = uuid.UUID(payload.assigneeId) if payload.assigneeId else None
        milestone_uuid = uuid.UUID(payload.milestoneId) if payload.milestoneId else None

        task = Task(
            tenant_id=tenant_id,
            name=payload.name,
            description=payload.description,
            priority=payload.priority or "medium",
            status=payload.status or "todo",
            assignee_id=assignee_uuid,
            project_id=proj_uuid,
            milestone_id=milestone_uuid,
            estimated_hours=payload.estimatedHours or 0.0,
            due_date=datetime.strptime(payload.dueDate, "%Y-%m-%d").date() if payload.dueDate else None,
            start_date=datetime.strptime(payload.startDate, "%Y-%m-%d").date() if payload.startDate else None
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return ProjectService._serialize_task(task, db)

    @staticmethod
    def list_tasks(db: Session, tenant_id: uuid.UUID) -> list:
        tasks = db.query(Task).filter(Task.tenant_id == tenant_id).all()
        return [ProjectService._serialize_task(t, db) for t in tasks]

    @staticmethod
    def update_task_status(db: Session, task_id: str, status: str, tenant_id: uuid.UUID) -> dict:
        t_uuid = uuid.UUID(task_id)
        task = db.query(Task).filter(Task.id == t_uuid, Task.tenant_id == tenant_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        task.status = status
        db.commit()
        db.refresh(task)
        return ProjectService._serialize_task(task, db)

    @staticmethod
    def create_timesheet(db: Session, payload: TimesheetCreateSchema, employee_id: uuid.UUID, tenant_id: uuid.UUID) -> dict:
        proj_uuid = uuid.UUID(payload.projectId)
        task_uuid = uuid.UUID(payload.taskId)

        timesheet = Timesheet(
            tenant_id=tenant_id,
            employee_id=employee_id,
            project_id=proj_uuid,
            task_id=task_uuid,
            date=datetime.strptime(payload.date, "%Y-%m-%d").date(),
            hours_worked=payload.hoursWorked,
            description=payload.description,
            billable=payload.billable if payload.billable is not None else True,
            billing_rate=payload.billingRate or 0.0,
            status="pending"
        )
        db.add(timesheet)

        # Increment actual hours in task
        task = db.query(Task).filter(Task.id == task_uuid).first()
        if task:
            task.actual_hours += payload.hoursWorked

        db.commit()
        db.refresh(timesheet)
        return ProjectService._serialize_timesheet(timesheet, db)

    @staticmethod
    def list_timesheets(db: Session, tenant_id: uuid.UUID) -> list:
        timesheets = db.query(Timesheet).filter(Timesheet.tenant_id == tenant_id).all()
        return [ProjectService._serialize_timesheet(t, db) for t in timesheets]

    @staticmethod
    def approve_timesheet(db: Session, timesheet_id: str, status: str, tenant_id: uuid.UUID) -> dict:
        t_uuid = uuid.UUID(timesheet_id)
        ts = db.query(Timesheet).filter(Timesheet.id == t_uuid, Timesheet.tenant_id == tenant_id).first()
        if not ts:
            raise HTTPException(status_code=404, detail="Timesheet not found")
        ts.status = status
        db.commit()
        db.refresh(ts)
        return ProjectService._serialize_timesheet(ts, db)

    @staticmethod
    def create_milestone(db: Session, payload: MilestoneCreateSchema, tenant_id: uuid.UUID) -> dict:
        proj_uuid = uuid.UUID(payload.projectId)
        ms = Milestone(
            tenant_id=tenant_id,
            name=payload.name,
            project_id=proj_uuid,
            description=payload.description,
            due_date=datetime.strptime(payload.dueDate, "%Y-%m-%d").date(),
            completion_percentage=payload.completionPercentage or 0.0,
            status="pending"
        )
        db.add(ms)
        db.commit()
        db.refresh(ms)
        return ProjectService._serialize_milestone(ms, db)

    @staticmethod
    def list_milestones(db: Session, tenant_id: uuid.UUID) -> list:
        milestones = db.query(Milestone).filter(Milestone.tenant_id == tenant_id).all()
        return [ProjectService._serialize_milestone(m, db) for m in milestones]

    @staticmethod
    def create_risk(db: Session, payload: RiskCreateSchema, tenant_id: uuid.UUID) -> dict:
        proj_uuid = uuid.UUID(payload.projectId)
        risk = ProjectRisk(
            tenant_id=tenant_id,
            project_id=proj_uuid,
            name=payload.name,
            probability=payload.probability,
            impact=payload.impact,
            resolution_plan=payload.resolutionPlan,
            status="open"
        )
        db.add(risk)
        db.commit()
        db.refresh(risk)
        return {
            "_id": str(risk.id),
            "projectId": str(risk.project_id),
            "name": risk.name,
            "probability": risk.probability,
            "impact": risk.impact,
            "resolutionPlan": risk.resolution_plan,
            "status": risk.status
        }

    @staticmethod
    def list_risks(db: Session, tenant_id: uuid.UUID) -> list:
        risks = db.query(ProjectRisk).filter(ProjectRisk.tenant_id == tenant_id).all()
        return [{
            "_id": str(r.id),
            "projectId": str(r.project_id),
            "name": r.name,
            "probability": r.probability,
            "impact": r.impact,
            "resolutionPlan": r.resolution_plan,
            "status": r.status
        } for r in risks]

    @staticmethod
    def get_dashboard_summary(db: Session, tenant_id: uuid.UUID) -> dict:
        projects = db.query(Project).filter(Project.tenant_id == tenant_id).all()
        tasks = db.query(Task).filter(Task.tenant_id == tenant_id).all()
        timesheets = db.query(Timesheet).filter(Timesheet.tenant_id == tenant_id).all()

        total_budget = sum(p.budget for p in projects)
        total_hours = sum(ts.hours_worked for ts in timesheets)
        billable_hours = sum(ts.hours_worked for ts in timesheets if ts.billable)
        billing_revenue = sum(ts.hours_worked * ts.billing_rate for ts in timesheets if ts.billable)

        # Workload allocations calculation
        employee_workload = {}
        for t in tasks:
            if t.assignee_id and t.status != "completed":
                emp = db.query(Employee).filter(Employee.id == t.assignee_id).first()
                emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Unassigned Staff"
                employee_workload[emp_name] = employee_workload.get(emp_name, 0) + 1

        workload_stats = [{"name": name, "tasks": count} for name, count in employee_workload.items()]

        return {
            "totalProjects": len(projects),
            "activeProjects": len([p for p in projects if p.status == "active"]),
            "completedProjects": len([p for p in projects if p.status == "completed"]),
            "delayedProjects": len([p for p in projects if p.status == "delayed"]),
            "totalBudget": total_budget,
            "totalTasks": len(tasks),
            "completedTasks": len([t for t in tasks if t.status == "completed"]),
            "pendingTasks": len([t for t in tasks if t.status != "completed"]),
            "totalHoursLogged": total_hours,
            "billableHours": billable_hours,
            "billingRevenue": billing_revenue,
            "workload": workload_stats
        }

    # Helper Serializers
    @staticmethod
    def _serialize_project(p: Project, db: Session) -> dict:
        mgr = db.query(Employee).filter(Employee.id == p.manager_id).first() if p.manager_id else None
        return {
            "_id": str(p.id),
            "projectCode": p.project_code,
            "name": p.name,
            "client": p.client,
            "department": p.department,
            "budget": p.budget,
            "startDate": str(p.start_date),
            "endDate": str(p.end_date) if p.end_date else None,
            "priority": p.priority,
            "status": p.status,
            "description": p.description,
            "managerId": str(p.manager_id) if p.manager_id else None,
            "managerName": f"{mgr.first_name} {mgr.last_name}" if mgr else "N/A",
            "members": p.members
        }

    @staticmethod
    def _serialize_task(t: Task, db: Session) -> dict:
        assignee = db.query(Employee).filter(Employee.id == t.assignee_id).first() if t.assignee_id else None
        proj = db.query(Project).filter(Project.id == t.project_id).first()
        return {
            "_id": str(t.id),
            "name": t.name,
            "description": t.description,
            "priority": t.priority,
            "status": t.status,
            "assigneeId": str(t.assignee_id) if t.assignee_id else None,
            "assigneeName": f"{assignee.first_name} {assignee.last_name}" if assignee else "Unassigned",
            "projectId": str(t.project_id),
            "projectName": proj.name if proj else "Unknown Project",
            "milestoneId": str(t.milestone_id) if t.milestone_id else None,
            "estimatedHours": t.estimated_hours,
            "actualHours": t.actual_hours,
            "dueDate": str(t.due_date) if t.due_date else None,
            "startDate": str(t.start_date) if t.start_date else None
        }

    @staticmethod
    def _serialize_timesheet(t: Timesheet, db: Session) -> dict:
        emp = db.query(Employee).filter(Employee.id == t.employee_id).first()
        proj = db.query(Project).filter(Project.id == t.project_id).first()
        task = db.query(Task).filter(Task.id == t.task_id).first()
        return {
            "_id": str(t.id),
            "employeeId": str(t.employee_id),
            "employeeName": f"{emp.first_name} {emp.last_name}" if emp else "Unknown Staff",
            "projectId": str(t.project_id),
            "projectName": proj.name if proj else "Unknown",
            "taskId": str(t.task_id),
            "taskName": task.name if task else "Unknown",
            "date": str(t.date),
            "hoursWorked": t.hours_worked,
            "description": t.description,
            "billable": t.billable,
            "billingRate": t.billing_rate,
            "status": t.status
        }

    @staticmethod
    def _serialize_milestone(m: Milestone, db: Session) -> dict:
        proj = db.query(Project).filter(Project.id == m.project_id).first()
        return {
            "_id": str(m.id),
            "name": m.name,
            "projectId": str(m.project_id),
            "projectName": proj.name if proj else "Unknown Project",
            "description": m.description,
            "dueDate": str(m.due_date),
            "status": m.status,
            "completionPercentage": m.completion_percentage
        }
