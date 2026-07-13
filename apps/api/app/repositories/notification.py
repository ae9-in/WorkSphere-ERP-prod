from app.repositories.base import BaseRepository
from app.models.notification import Notification

class NotificationRepository(BaseRepository[Notification]):
    def __init__(self):
        super().__init__(Notification)
