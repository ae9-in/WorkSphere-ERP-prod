from app.repositories.base import BaseRepository
from app.models.workflow import WorkflowDefinition

class WorkflowRepository(BaseRepository[WorkflowDefinition]):
    def __init__(self):
        super().__init__(WorkflowDefinition)
