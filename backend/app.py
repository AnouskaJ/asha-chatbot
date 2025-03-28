    new_users: Optional[int] # Marked as Optional as it's hard to track from events
    retention_rate: Optional[float] # Marked as Optional
    # Add other user metrics if needed

class AccuracyRatings(TypedDict, total=False):
    accurate: int
    inaccurate: int
    unsure: int
    other: int

class ResponseQuality(TypedDict, total=False):
     helpful: int
     not_helpful: int

class FeedbackAnalytics(TypedDict, total=False):
    total_feedback: int
    accuracy_ratings: AccuracyRatings
    calculated_accuracy_rate: Optional[float] # Can be None
    feedback_by_date: Dict[str, int] # Key is YYYY-MM-DD date string
    response_quality: ResponseQuality
    last_updated: Optional[str] # ISO format timestamp

# Define the main AnalyticsData structure
class AnalyticsData(TypedDict):
    # These keys are expected based on the aggregation logic
    conversations: ConversationsAnalytics
    users: UserAnalytics
    feedback: FeedbackAnalytics
