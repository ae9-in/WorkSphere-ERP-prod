from app.core.database import Base
from app.models.base import BaseModel, TenantBaseModel
from app.models.company import Company
from app.models.settings import Department, Designation, EmploymentType, Branch, CompanySettings, HolidayCalendar, Holiday
from app.models.employee import Employee, EmployeeEducation, EmployeeExperience, EmployeeEmergencyContact
from app.models.user import User
from app.models.attendance import (
    Attendance, Shift, ShiftAssignment, AttendanceBreak,
    AttendanceRegularization, OvertimeRequest, AttendanceTimeline
)
from app.models.leave import (
    LeaveType, LeaveBalance, LeaveApplication, LeaveApplicationComment,
    LeaveLedger, LeaveEncashment, LeaveCarryForward, LeaveTimeline
)
from app.models.payroll import (
    SalaryStructure, SalaryStructureComponent, PayrollRun, Payslip,
    PayrollCalendar, PayGroup, EmployeeSalary, PayrollAdjustment,
    PayrollLoan, PayrollReimbursement, PayrollLedger
)
from app.models.asset import Asset, AssetAssignment
from app.models.document import DocumentModel
from app.models.workflow import (
    WorkflowDefinition, WorkflowDefinitionStep, WorkflowInstance, WorkflowInstanceStep,
    WorkflowAutomation, WorkflowExecution, WorkflowExecutionLog
)
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.models.onboarding import Onboarding
from app.models.approval import Approval
from app.models.rbac import Permission, Role, RolePermission, UserRole
from app.models.recruitment import (
    HiringPlan, JobRequisition, JobPosting,
    Candidate, CandidateSkill, CandidateExperience, CandidateEducation,
    CandidateReference, ReferenceCheck,
    Assessment, Interview, InterviewFeedback,
    Offer, BackgroundVerification,
    RecruitmentPipelineHistory, RecruiterAssignment,
    RecruitmentTimeline
)
from app.models.performance import (
    PerformanceCycle, PerformanceTemplate, Goal, KeyResult, Competency,
    CompetencyScore, PerformanceReview, Feedback360, PerformanceJournal,
    PIPRecord, PerformancePromotion, PerformanceRecognition, SuccessionPlan,
    PerformanceTimeline
)
from app.models.ai_interview import (
    AIInterviewSession, AIInterviewQuestion, AIInterviewResponse
)
from app.models.assessment_engine import (
    AssessmentTemplate, AssessmentAttempt
)
from app.models.lms import (
    Course, Lesson, CourseEnrollment
)
from app.models.community import (
    Announcement, FeedPost, Poll, PollVote
)
from app.models.helpdesk import (
    Ticket, TicketComment
)
from app.models.inventory import (
    InventoryCategory, InventoryItem, Warehouse, WarehouseLocation,
    StockBalance, StockMovement, StockBatch, StockSerial,
    WarehouseTask, InventoryCount, InventoryCountItem,
    InventoryAdjustment, InventoryValuation, ReorderRecommendation,
    InventoryForecast, InventoryTimeline,
    StockReservation, InventoryQualityInspection, LandedCostVoucher,
    LandedCostItem, SerialAssetAssignment,
    Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceipt
)
from app.models.manufacturing import (
    ManufacturingPlant, ProductionCalendar, BillOfMaterials, BOMComponent,
    RoutingMaster, RoutingOperation, WorkCenter, Machine,
    ProductionOrder, WorkOrder, MaterialConsumption, WorkInProgress,
    ProductionOutput, QualityInspection, NonConformanceReport, ScrapRecord,
    MachinePerformance, ProductionAnalytics, ManufacturingTimeline, ManufacturingAuditLog
)
from app.models.maintenance import (
    MaintenanceAsset, EquipmentMaster, AssetHierarchy, MaintenancePlan,
    MaintenanceCalendar, MaintenanceRequest, MaintenanceWorkOrder,
    TechnicianAssignment, MaintenanceInspection, InspectionChecklist,
    SparePartsConsumption, MaintenanceHistory, AssetHealth, PredictiveAlert,
    MaintenanceCost, ReliabilityMetric, MaintenanceAnalytics,
    MaintenanceTimeline, MaintenanceAuditLog
)
from app.models.supply_chain import (
    SupplyChainNetwork, DistributionCenter, LogisticsPartner, Carrier,
    FleetVehicle, Driver, Shipment, ShipmentItem, DispatchOrder,
    DeliveryRoute, GPSTracking, ProofOfDelivery, ReverseLogistics,
    FreightCost, TransportationAnalytics, FleetPerformance,
    SupplyChainTimeline, SupplyChainAuditLog, CarrierRate, ContainerLoadingPlan, SCMDelayAlert
)
from app.models.finance import (
    Account, JournalEntry, JournalItem,
    ExpenseClaim, ExpenseLine, ExpensePolicy,
    Invoice, InvoiceItem, InvoicePayment,
    Budget, BudgetForecast, BudgetVariance,
    TaxFiling, TaxTransaction
)
from app.models.crm import (
    Lead, Customer, Contact,
    Quotation, QuotationItem,
    SalesOrder, SalesOrderItem,
    CRMTask
)
from app.models.project import (
    Project, Task, Subtask, TaskDependency, Timesheet, Milestone, ProjectRisk
)
from app.models.analytics import (
    BIDashboard, BIDashboardWidget, BIReport, BIScheduledReport, BIAlertRule, BIAlertLog
)



