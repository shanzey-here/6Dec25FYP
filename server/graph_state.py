# # -*- coding: utf-8 -*-
# """State definition for SRS LangGraph workflow."""
# from typing import TypedDict, List, Optional
# from langchain_core.messages import BaseMessage

# class SRSProjectState(TypedDict):
#     """State container for SRS generation workflow."""
#     messages: List[BaseMessage]  # Conversation history
#     session_id: str              # For database linking
    
#     # Phase tracking
#     current_phase: str          # "qualification" | "requirements" | "generation"
    
#     # Qualification data
#     project_type: Optional[str]
#     budget: Optional[str]
#     timeline: Optional[str]
#     score: Optional[int]
#     email: Optional[str]
    
#     # Project overview
#     project_name: Optional[str]
#     project_description: Optional[str]
    
#     # Control flags
#     qualification_complete: bool
#     requirements_complete: bool
#     srs_generated: bool
