# # -*- coding: utf-8 -*-
# """Test LangGraph imports."""
# import sys

# print("Testing LangGraph imports...")

# try:
#     from langgraph.graph import StateGraph, END
#     print("✅ StateGraph, END imported")
# except ImportError as e:
#     print(f"❌ StateGraph import failed: {e}")

# try:
#     from langgraph.checkpoint.sqlite import SqliteSaver
#     print("✅ SqliteSaver imported")
# except ImportError as e:
#     print(f"❌ SqliteSaver import failed: {e}")

# try:
#     from langgraph.prebuilt import ToolNode
#     print("✅ ToolNode imported")
# except ImportError as e:
#     print(f"❌ ToolNode import failed: {e}")

# try:
#     from langchain_core.messages import HumanMessage, AIMessage
#     print("✅ LangChain messages imported")
# except ImportError as e:
#     print(f"❌ LangChain import failed: {e}")

# print("\nPython path:")
# for path in sys.path:
#     print(f"  {path}")
