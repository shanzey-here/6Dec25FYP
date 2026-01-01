# # -*- coding: utf-8 -*-
# """Setup script for LangGraph migration."""
# import sqlite3
# import os

# def setup_langgraph_tables():
#     """Initialize database tables for LangGraph checkpointing."""
#     print("=" * 60)
#     print("LangGraph Migration Setup")
#     print("=" * 60)
    
#     # Ensure instance directory exists
#     os.makedirs("instance", exist_ok=True)
    
#     # Create checkpoint tables manually
#     try:
#         db_path = "instance/leads.db"
#         conn = sqlite3.connect(db_path)
#         cursor = conn.cursor()
        
#         print("Creating LangGraph checkpoint tables...")
        
#         # Create checkpoint tables
#         cursor.execute("""
#             CREATE TABLE IF NOT EXISTS checkpoints (
#                 thread_id TEXT,
#                 checkpoint_id TEXT,
#                 checkpoint BLOB,
#                 parent_checkpoint_id TEXT,
#                 PRIMARY KEY (thread_id, checkpoint_id)
#             )
#         """)
        
#         cursor.execute("""
#             CREATE TABLE IF NOT EXISTS checkpoint_parents (
#                 thread_id TEXT,
#                 checkpoint_id TEXT,
#                 parent_checkpoint_id TEXT,
#                 PRIMARY KEY (thread_id, checkpoint_id, parent_checkpoint_id)
#             )
#         """)
        
#         conn.commit()
#         conn.close()
        
#         print("✅ LangGraph checkpoint tables created successfully!")
        
#     except Exception as e:
#         print(f"⚠️ Could not create LangGraph tables: {e}")
#         print("⚠️ Checkpointing will be disabled, but workflow will still work")
    
#     # Test imports
#     print("\nTesting LangGraph imports...")
#     try:
#         from langgraph.graph import StateGraph, END
#         from langgraph.checkpoint.sqlite import SqliteSaver
#         print("✅ LangGraph imports successful")
        
#         # Test database connection
#         from app import app, db, initialize_categories
#         with app.app_context():
#             db.create_all()
#             initialize_categories()
#             print("✅ Main database tables ready")
            
#     except ImportError as e:
#         print(f"❌ LangGraph import failed: {e}")
#         print("Try: pip install langgraph-checkpoint==3.0.1")
#         return False
#     except Exception as e:
#         print(f"❌ Database setup failed: {e}")
#         return False
    
#     print("\n" + "=" * 60)
#     print("SETUP COMPLETE")
#     print("=" * 60)
#     print("Next steps:")
#     print("1. Start the server: python app.py")
#     print("2. Test the API: curl http://localhost:5000/api/system/status")
#     print("3. Check console for LangGraph initialization message")
#     print("=" * 60)
#     return True

# if __name__ == "__main__":
#     setup_langgraph_tables()
