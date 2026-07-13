from app.repositories.base import BaseRepository
from app.models.audit import AuditLog

class AuditRepository(BaseRepository[AuditLog]):
    def __init__(self):
        super().__init__(AuditLog)
