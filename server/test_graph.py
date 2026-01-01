# # server/test_graph.py
# from app import app, db
# from models import Lead
# import json

# def test_migration():
#     """Test that the basic structure works."""
#     with app.app_context():
#         # Check database connection
#         leads = Lead.query.count()
#         print(f"Database has {leads} leads")
        
#         # Check if we can create a new lead
#         new_lead = Lead(full_transcript=json.dumps([]))
#         db.session.add(new_lead)
#         db.session.commit()
        
#         print(f"Created test lead: {new_lead.session_uuid}")
#         print("✓ Basic database operations working")
        
#         # Cleanup
#         db.session.delete(new_lead)
#         db.session.commit()

# if __name__ == "__main__":
#     test_migration()