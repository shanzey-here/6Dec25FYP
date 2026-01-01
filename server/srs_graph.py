# # -*- coding: utf-8 -*-
# """LangGraph workflow for SRS generation."""
# from typing import Literal
# from langgraph.graph import StateGraph, END
# from langgraph.prebuilt import ToolNode
# from langchain_core.messages import HumanMessage, AIMessage
# from graph_state import SRSProjectState

# class SRSGraph:
#     def __init__(self, tools):
#         self.tools = tools
#         self.tool_node = ToolNode(tools)
#         self.build_graph()
    
#     def build_graph(self):
#         """Build the 3-phase workflow graph."""
#         workflow = StateGraph(SRSProjectState)
        
#         # Add nodes
#         workflow.add_node("qualify", self.qualify_lead)
#         workflow.add_node("gather", self.gather_requirements)
#         workflow.add_node("generate", self.generate_srs)
#         workflow.add_node("tools", self.tool_node)
        
#         # Entry point
#         workflow.set_entry_point("qualify")
        
#         # Define transitions
#         workflow.add_conditional_edges(
#             "qualify",
#             self.after_qualification,
#             {
#                 "continue": "qualify",
#                 "qualified": "gather",
#                 "use_tool": "tools"
#             }
#         )
        
#         workflow.add_conditional_edges(
#             "gather",
#             self.after_requirements,
#             {
#                 "continue": "gather",
#                 "complete": "generate",
#                 "use_tool": "tools"
#             }
#         )
        
#         workflow.add_edge("generate", END)
#         workflow.add_edge("tools", "qualify")
        
#         # Compile
#         self.graph = workflow.compile()
    
#     def qualify_lead(self, state: SRSProjectState) -> dict:
#         """Phase 1: Ask qualification questions."""
#         questions = [
#             ("project_type", "What type of software project are you looking to build?"),
#             ("budget", "What is your budget range?"),
#             ("timeline", "What is your timeline for this project?"),
#             ("score", "On a scale of 1-10, how serious are you about this project?"),
#             ("email", "What's your email address for follow-up?")
#         ]
        
#         for field, question in questions:
#             if not state.get(field):
#                 return {
#                     "messages": [AIMessage(content=question)],
#                     "current_phase": "qualification"
#                 }
        
#         return {
#             "qualification_complete": True,
#             "current_phase": "requirements"
#         }
    
#     def gather_requirements(self, state: SRSProjectState) -> dict:
#         """Phase 2: Gather requirements."""
#         if not state.get("project_name"):
#             return {
#                 "messages": [AIMessage(content="What is your project name?")],
#                 "current_phase": "requirements"
#             }
        
#         if not state.get("project_description"):
#             return {
#                 "messages": [AIMessage(content="Please describe your project:")],
#                 "current_phase": "requirements"
#             }
        
#         # Continue gathering individual requirements
#         return {
#             "messages": [AIMessage(
#                 content="Describe a requirement (or say 'done' when finished):"
#             )],
#             "current_phase": "requirements"
#         }
    
#     def generate_srs(self, state: SRSProjectState) -> dict:
#         """Phase 3: Generate SRS."""
#         return {
#             "messages": [AIMessage(content="✅ Generating your SRS document...")],
#             "current_phase": "generation",
#             "srs_generated": True
#         }
    
#     def after_qualification(self, state: SRSProjectState) -> str:
#         """Decide next step after qualification."""
#         last_msg = state["messages"][-1] if state["messages"] else None
        
#         # Check for tool use
#         if last_msg and hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
#             return "use_tool"
        
#         # Check if qualification complete
#         if state.get("qualification_complete"):
#             return "qualified"
        
#         return "continue"
    
#     def after_requirements(self, state: SRSProjectState) -> str:
#         """Decide next step after requirements."""
#         last_msg = state["messages"][-1] if state["messages"] else None
        
#         # Check for tool use
#         if last_msg and hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
#             return "use_tool"
        
#         # Check if user said "done"
#         user_msgs = [m for m in state["messages"] if isinstance(m, HumanMessage)]
#         if user_msgs and any(word in user_msgs[-1].content.lower() 
#                            for word in ["done", "complete", "finished", "that's all"]):
#             return "complete"
        
#         return "continue"
# # server/srs_graph.py
# from typing import Literal, TypedDict, List, Optional
# from langchain_core.messages import HumanMessage, AIMessage

# class SRSProjectState(TypedDict):
#     messages: List[HumanMessage | AIMessage]
#     session_id: str
#     current_phase: str
#     project_type: Optional[str]
#     budget: Optional[str]
#     timeline: Optional[str]
#     score: Optional[int]
#     email: Optional[str]
#     project_name: Optional[str]
#     project_description: Optional[str]
#     qualification_complete: bool
#     requirements_complete: bool
#     srs_generated: bool

# class SRSGraph:
#     def __init__(self, tools):
#         self.tools = tools
#         self.graph = self.build_graph()
    
#     def build_graph(self):
#         from langgraph.graph import StateGraph, END
#         from langgraph.prebuilt import ToolNode
        
#         workflow = StateGraph(SRSProjectState)
#         tool_node = ToolNode(self.tools)
        
#         workflow.add_node("qualify", self.qualify_lead)
#         workflow.add_node("gather", self.gather_requirements)
#         workflow.add_node("tools", tool_node)
        
#         workflow.set_entry_point("qualify")
        
#         workflow.add_conditional_edges(
#             "qualify",
#             self.after_qualification,
#             {"continue": "qualify", "qualified": "gather", "tool": "tools"}
#         )
        
#         workflow.add_conditional_edges(
#             "gather",
#             self.after_requirements,
#             {"continue": "gather", "complete": END, "tool": "tools"}
#         )
        
#         workflow.add_edge("tools", "qualify")
        
#         return workflow.compile()
    
#     def qualify_lead(self, state: SRSProjectState) -> dict:
#         questions = [
#             ("project_type", "What type of software project are you looking to build?"),
#             ("budget", "What is your budget range?"),
#             ("timeline", "What is your timeline for this project?"),
#             ("score", "On a scale of 1-10, how serious are you about this project?"),
#             ("email", "What's your email address for follow-up?")
#         ]
        
#         for field, question in questions:
#             if not state.get(field):
#                 return {"messages": [AIMessage(content=question)], "current_phase": "qualification"}
        
#         return {"qualification_complete": True, "current_phase": "requirements"}
    
#     def gather_requirements(self, state: SRSProjectState) -> dict:
#         if not state.get("project_name"):
#             return {"messages": [AIMessage(content="What is your project name?")]}
        
#         if not state.get("project_description"):
#             return {"messages": [AIMessage(content="Please describe your project:")]}
        
#         return {"messages": [AIMessage(content="Describe a requirement (or say 'done' when finished):")]}
    
#     def after_qualification(self, state: SRSProjectState) -> str:
#         last_msg = state["messages"][-1] if state["messages"] else None
#         if last_msg and hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
#             return "tool"
#         if state.get("qualification_complete"):
#             return "qualified"
#         return "continue"
    
#     def after_requirements(self, state: SRSProjectState) -> str:
#         last_msg = state["messages"][-1] if state["messages"] else None
#         if last_msg and hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
#             return "tool"
        
#         user_msgs = [m for m in state["messages"] if isinstance(m, HumanMessage)]
#         if user_msgs and any(word in user_msgs[-1].content.lower() 
#                            for word in ["done", "complete", "finished"]):
#             return "complete"
        
#         return "continue"