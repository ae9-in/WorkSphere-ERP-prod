from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, DateTime, JSON, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import TenantBaseModel, BaseModel

class BIDashboard(TenantBaseModel):
    __tablename__ = "bi_dashboards"

    name             = Column(String, nullable=False)
    description      = Column(String, nullable=True)
    category         = Column(String, default="executive", nullable=False) # executive, finance, hr, crm, inventory, operations
    is_shared        = Column(Boolean, default=True, nullable=False)
    role_restrictions = Column(JSON, default=list, nullable=False) # list of roles

    widgets          = relationship("BIDashboardWidget", back_populates="dashboard", cascade="all, delete-orphan")


class BIDashboardWidget(BaseModel):
    __tablename__ = "bi_dashboard_widgets"

    dashboard_id     = Column(UUID(as_uuid=True), ForeignKey("bi_dashboards.id", ondelete="CASCADE"), nullable=False, index=True)
    title            = Column(String, nullable=False)
    type             = Column(String, nullable=False) # kpi, bar, line, pie, table, gauge, heatmap
    size_x           = Column(Integer, default=1, nullable=False) # width
    size_y           = Column(Integer, default=1, nullable=False) # height
    pos_x            = Column(Integer, default=0, nullable=False) # column position
    pos_y            = Column(Integer, default=0, nullable=False) # row position
    query_config     = Column(JSON, default=dict, nullable=False) # configurations for data queries

    dashboard        = relationship("BIDashboard", back_populates="widgets")


class BIReport(TenantBaseModel):
    __tablename__ = "bi_reports"

    name             = Column(String, nullable=False)
    description      = Column(String, nullable=True)
    category         = Column(String, default="custom", nullable=False) # hr, finance, crm, inventory, projects, operations, custom
    config           = Column(JSON, default=dict, nullable=False) # fields, filters, aggregates, joins, order_by
    created_by       = Column(UUID(as_uuid=True), nullable=True)

    schedules        = relationship("BIScheduledReport", back_populates="report", cascade="all, delete-orphan")


class BIScheduledReport(TenantBaseModel):
    __tablename__ = "bi_scheduled_reports"

    report_id        = Column(UUID(as_uuid=True), ForeignKey("bi_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    cron_expression  = Column(String, nullable=False) # cron string
    delivery_channel = Column(String, default="email", nullable=False) # email, slack, teams
    delivery_config  = Column(JSON, default=dict, nullable=False) # email addresses, Slack webhooks, templates
    is_active        = Column(Boolean, default=True, nullable=False)

    report           = relationship("BIReport", back_populates="schedules")


class BIAlertRule(TenantBaseModel):
    __tablename__ = "bi_alert_rules"

    name             = Column(String, nullable=False)
    kpi_name         = Column(String, nullable=False) # e.g. monthly_payroll, revenue, stock_level
    condition_operator = Column(String, nullable=False) # greater_than, less_than, equals
    threshold_value  = Column(Float, nullable=False)
    channel          = Column(String, default="email", nullable=False) # email, slack, notification
    recipient        = Column(String, nullable=False) # email address or user ID
    is_active        = Column(Boolean, default=True, nullable=False)

    logs             = relationship("BIAlertLog", back_populates="alert_rule", cascade="all, delete-orphan")


class BIAlertLog(BaseModel):
    __tablename__ = "bi_alert_logs"

    alert_rule_id    = Column(UUID(as_uuid=True), ForeignKey("bi_alert_rules.id", ondelete="CASCADE"), nullable=False, index=True)
    triggered_at     = Column(DateTime, default=datetime.utcnow, nullable=False)
    triggered_value  = Column(Float, nullable=False)
    message          = Column(String, nullable=False)

    alert_rule       = relationship("BIAlertRule", back_populates="logs")
