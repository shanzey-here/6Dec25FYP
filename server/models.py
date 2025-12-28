# # server/models.py

# from datetime import datetime
# from uuid import uuid4
# # --- CHANGE HERE ---
# from database import db # Import the db object from the new database.py
# # --- END CHANGE ---

# # Define the Lead Model
# class Lead(db.Model):
# # ... (rest of the Lead class definition remains the same)
#     __tablename__ = 'leads'

#     id = db.Column(db.Integer, primary_key=True)
#     session_uuid = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid4())) 
# # ... (rest of the fields)
#     status = db.Column(db.String(50), default='New') 
#     full_transcript = db.Column(db.Text)             
    
#     # --- AI Generated Report Fields ---
#     seriousness_score = db.Column(db.Integer)      
#     project_type = db.Column(db.String(100))
#     tech_stack_suggestions = db.Column(db.Text)    
#     estimated_time_weeks = db.Column(db.Integer)
#     clarity_of_requirement = db.Column(db.String(50))
    
#     def __repr__(self):
#         return f"<Lead {self.session_uuid}>"

#     def to_dict(self):
#         """Returns a dictionary representation for API responses."""
#         return {
#             'id': self.id,
#             'session_uuid': self.session_uuid,
#             'created_at': self.created_at.isoformat(),
#             'status': self.status,
#             'seriousness_score': self.seriousness_score,
#         }


# # server/models.py (UPDATED)
# from database import db
# from datetime import datetime
# import json
# from uuid import uuid4

# class Lead(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     session_uuid = db.Column(db.String(36), unique=True, default=lambda: str(uuid4()), nullable=False)
#     created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
#     # --- Qualification Data (Core Fields) ---
#     email = db.Column(db.String(120), nullable=True, index=True)
#     status = db.Column(db.String(50), default='New')
#     project_type = db.Column(db.String(100), nullable=True)
#     budget = db.Column(db.String(100), nullable=True)
#     estimated_time_weeks = db.Column(db.String(100), nullable=True)
#     seriousness_score = db.Column(db.Integer, nullable=True)
#     clarity_of_requirement = db.Column(db.String(50), nullable=True)
    
#     # --- Full History / Transcript ---
#     full_transcript = db.Column(db.Text, default='[]')
    
#     # --- NEW FIELDS FOR AUTOMATION AND DASHBOARD ---
#     automation_status = db.Column(db.String(50), default='Pending Meeting')
#     meeting_link = db.Column(db.String(255), nullable=True)
#     # budget_numeric = db.Column(db.Float, nullable=True) # Optional, keeping simple for now
    
#     def to_dict(self):
#         # Parses the full transcript string back into a list of messages for the frontend
#         transcript_messages = json.loads(self.full_transcript)
        
#         return {
#             'id': self.id,
#             'session_uuid': self.session_uuid,
#             'created_at': self.created_at.isoformat() if self.created_at else None,
#             'status': self.status,
#             'project_type': self.project_type,
#             'budget': self.budget,
#             'estimated_time_weeks': self.estimated_time_weeks,
#             'seriousness_score': self.seriousness_score,
#             'clarity_of_requirement': self.clarity_of_requirement,
#             'full_transcript': transcript_messages,
#             'automation_status': self.automation_status, # NEW
#             'meeting_link': self.meeting_link,         # NEW
#         }



# server/models.py
from database import db
from datetime import datetime
import json
from uuid import uuid4

class Lead(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_uuid = db.Column(db.String(36), unique=True, default=lambda: str(uuid4()), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # --- Qualification Data (Core Fields) ---
    email = db.Column(db.String(120), nullable=True, index=True)
    status = db.Column(db.String(50), default='New')  # New, Qualified, Requirements_Gathered, SRS_Generated
    project_type = db.Column(db.String(100), nullable=True)
    budget = db.Column(db.String(100), nullable=True)
    estimated_time_weeks = db.Column(db.String(100), nullable=True)
    seriousness_score = db.Column(db.Integer, nullable=True)
    clarity_of_requirement = db.Column(db.String(50), nullable=True)
    
    # --- Full History / Transcript ---
    full_transcript = db.Column(db.Text, default='[]')
    
    # --- NEW FIELDS FOR SRS GENERATION ---
    project_name = db.Column(db.String(200), nullable=True)
    project_description = db.Column(db.Text, nullable=True)
    target_users = db.Column(db.Text, nullable=True)  # JSON array of user types
    key_features = db.Column(db.Text, nullable=True)  # JSON array of features
    
    # --- SRS Document Info ---
    srs_version = db.Column(db.String(20), default="1.0")
    srs_generated_at = db.Column(db.DateTime, nullable=True)
    srs_status = db.Column(db.String(50), default="Not Generated")  # Not Generated, Draft, Final
    
    # --- Automation Fields ---
    automation_status = db.Column(db.String(50), default='Pending Meeting')
    meeting_link = db.Column(db.String(255), nullable=True)
    
    # Relationships
    requirements = db.relationship('ProjectRequirement', backref='lead', cascade='all, delete-orphan')
    srs_documents = db.relationship('SRSDocument', backref='lead', cascade='all, delete-orphan')

    def to_dict(self):
        # Parses the full transcript string back into a list of messages for the frontend
        transcript_messages = json.loads(self.full_transcript) if self.full_transcript else []
        
        # Parse JSON fields
        target_users_list = json.loads(self.target_users) if self.target_users else []
        key_features_list = json.loads(self.key_features) if self.key_features else []
        
        # Get requirements count
        requirements_count = len(self.requirements) if self.requirements else 0
        
        return {
            'id': self.id,
            'session_uuid': self.session_uuid,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'status': self.status,
            'project_type': self.project_type,
            'project_name': self.project_name,
            'budget': self.budget,
            'estimated_time_weeks': self.estimated_time_weeks,
            'seriousness_score': self.seriousness_score,
            'clarity_of_requirement': self.clarity_of_requirement,
            'email': self.email,
            'full_transcript': transcript_messages,
            'target_users': target_users_list,
            'key_features': key_features_list,
            'requirements_count': requirements_count,
            'srs_version': self.srs_version,
            'srs_generated_at': self.srs_generated_at.isoformat() if self.srs_generated_at else None,
            'srs_status': self.srs_status,
            'automation_status': self.automation_status,
            'meeting_link': self.meeting_link,
        }


class RequirementCategory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True)  # e.g., "Functional", "Non-Functional", "Technical"
    description = db.Column(db.Text)
    color = db.Column(db.String(20), default="#0088FE")  # For UI visualization
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'color': self.color
        }


class ProjectRequirement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('requirement_category.id'), nullable=False)
    
    # Requirement details
    requirement_text = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text, nullable=True)
    priority = db.Column(db.String(20), default="Should")  # Must, Should, Could, Won't
    status = db.Column(db.String(20), default="Identified")  # Identified, Clarified, Approved, Rejected
    
    # Metadata
    identified_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = db.relationship('RequirementCategory')
    
    def to_dict(self):
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'category': self.category.name if self.category else None,
            'category_color': self.category.color if self.category else "#0088FE",
            'requirement_text': self.requirement_text,
            'description': self.description,
            'priority': self.priority,
            'status': self.status,
            'identified_at': self.identified_at.isoformat() if self.identified_at else None,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }


class SRSDocument(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'), nullable=False)
    
    # Document info
    version = db.Column(db.String(20), default="1.0")
    title = db.Column(db.String(200), default="Software Requirements Specification")
    content = db.Column(db.Text, nullable=False)  # Full SRS text in Markdown/HTML
    summary = db.Column(db.Text, nullable=True)  # Executive summary
    
    # Metadata
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_modified = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = db.Column(db.String(20), default="Draft")  # Draft, Review, Final, Archived
    
    # Format info
    format_type = db.Column(db.String(20), default="markdown")  # markdown, html, pdf
    
    def to_dict(self):
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'version': self.version,
            'title': self.title,
            'content': self.content[:500] + "..." if len(self.content) > 500 else self.content,  # Preview
            'summary': self.summary,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'last_modified': self.last_modified.isoformat() if self.last_modified else None,
            'status': self.status,
            'format_type': self.format_type
        }