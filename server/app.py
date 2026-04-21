# server/app.py - COMPLETE FIXED VERSION
from flask import Flask, request, jsonify, make_response, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import os
import json
from uuid import uuid4, UUID
import inspect
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload 
from sqlalchemy import case, func

# --- DEPENDENCY IMPORTS ---
from docx import Document
from docx.shared import Pt, Inches
from io import BytesIO

# --- LANGCHAIN AGENT ORCHESTRATION IMPORTS ---
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# --- DATABASE IMPORTS ---
from database import db
from models import Lead, RequirementCategory, ProjectRequirement, SRSDocument

from google.api_core.exceptions import ResourceExhausted

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}}) 

# --- Configuration ---
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///leads.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app) 

# --- INITIALIZATION FUNCTIONS ---

def initialize_categories():
    # This must remain for ProjectRequirement insertion to work, 
    # even if we don't expose the endpoints
    with app.app_context():
        categories = [
            ("Functional", "Features and functions the system must perform", "#0088FE"),
            ("Non-Functional", "Quality attributes and constraints", "#00C49F"),
            ("Technical", "Technical specifications and constraints", "#FFBB28"),
            ("User Interface", "UI/UX requirements", "#FF8042"),
            ("Business", "Business rules and processes", "#8884D8"),
            ("Security", "Security and privacy requirements", "#82CA9D"),
            ("Performance", "Performance and scalability requirements", "#FFC658"),
        ]
        
        for name, description, color in categories:
            if not RequirementCategory.query.filter_by(name=name).first():
                category = RequirementCategory(name=name, description=description, color=color)
                db.session.add(category)
        
        db.session.commit()
        print("✓ Requirement categories initialized")

# --- AGENT PROMPT AND TOOLS ---
# Update this in your app.py
SRS_SYSTEM_PROMPT = """
You are a Senior AI Solutions Architect specializing in Requirements Engineering. 
Your goal is to conduct a professional discovery interview to build an IEEE-compliant SRS.

COMMUNICATION STYLE:
- Be consultative. If the user mentions a feature, suggest a technical enhancement (e.g., "For that dashboard, should we add real-time data synchronization?").
- Ask exactly ONE question at a time.
- If the user is vague, ask about: 
    1. Responsiveness (Mobile vs Desktop).
    2. Database needs (SQL for structured data vs NoSQL for flexibility).
    3. UI Polish (Animations, Dark Mode).
    4. Security (Authentication, Encryption).

WORKFLOW:
Phase 1: Qualification (Type, Budget, Timeline, Seriousness, Email).
Phase 2: Project Overview (Name, Description, Target Audience).
Phase 3: Requirement Elicitation. Gather features one-by-one. 
    - For every feature, suggest a professional improvement.
    - Explicitly ask about "Non-Functional" needs (Performance, Security) before finishing.

STRICT TOOL ORDERING:
1. NEVER call 'generate_srs_document' until YOU have successfully called 'save_project_overview' AND 'save_lead_qualification'.
2. You must have gathered at least 3-4 specific features using 'save_requirement' before finishing.
"""

@tool
def save_lead_qualification(project_type: str, budget: str, timeline: str, seriousness_score: int, email: str) -> str:
    """
    Saves qualification data and moves to requirements gathering phase.
    """
    return f"QUALIFICATION_COMPLETE|type:{project_type}|budget:{budget}|timeline:{timeline}|score:{seriousness_score}|email:{email}"

@tool
def save_requirement(
    requirement_text: str,
    category: str = "Functional",
    priority: str = "Should",
) -> str:
    """
    Saves an individual requirement to the database. Categories: Functional, Non-Functional, Technical, User Interface, Business, Security, Performance
    """
    return f"REQUIREMENT_SAVED|category:{category}|text:{requirement_text[:50]}...|priority:{priority}"

@tool  
def save_project_overview(
    project_name: str,
    project_description: str,
    target_users: str,
    key_features: str
) -> str:
    """
    Saves high-level project overview information.
    """
    return f"PROJECT_OVERVIEW_SAVED|name:{project_name}|desc:{project_description[:50]}..."

@tool
def generate_srs_document(lead_id: str) -> str:
    """
    Signals that requirements gathering is complete and triggers the server to generate the SRS document.
    """
    return f"SRS_GENERATED|lead_id:{lead_id}|status:initiated"

TOOLS = [save_lead_qualification, save_requirement, save_project_overview, generate_srs_document]

def generate_docx_srs(lead):
    """Generates a professional IEEE-standard .docx SRS."""
    doc = Document()

    # EXACT FIX: Use the data if it exists, otherwise use a professional placeholder
    name = lead.project_name if lead.project_name else "Project Requirements Specification"
    desc = lead.project_description if lead.project_description else "Requirements discovery in progress."
    p_type = lead.project_type if lead.project_type else "Custom Software Development"
    timeline = lead.estimated_time_weeks if lead.estimated_time_weeks else "TBD"
    email = lead.email if lead.email else "Not provided"
    
    # --- 1. TITLE PAGE ---
    doc.add_heading('Software Requirements Specification', 0)
    doc.add_heading(f'Project: {lead.project_name or "Unnamed Project"}', level=1)
    doc.add_paragraph(f"Customer: {lead.email or 'N/A'}")
    doc.add_paragraph(f"Date: {datetime.utcnow().strftime('%B %d, %Y')}")
    doc.add_page_break()

    # --- 2. INTRODUCTION ---
    doc.add_heading('1. Introduction', level=1)
    doc.add_heading('1.1 Purpose', level=2)
    doc.add_paragraph(f"This document outlines the requirements for {lead.project_name}. It is intended for developers and stakeholders.")
    doc.add_heading('1.2 Scope', level=2)
    doc.add_paragraph(lead.project_description or "Detailed scope to be defined.")

    # --- 3. OVERALL DESCRIPTION ---
    doc.add_heading('2. Overall Description', level=1)
    doc.add_heading('2.1 Product Perspective', level=2)
    doc.add_paragraph(f"Project Type: {lead.project_type}. Target Timeline: {lead.estimated_time_weeks} weeks.")
    doc.add_heading('2.2 User Classes and Characteristics', level=2)
    users = json.loads(lead.target_users or '[]')
    for user in users:
        doc.add_paragraph(user, style='List Bullet')

    # --- 4. SYSTEM FEATURES (Functional Requirements) ---
    doc.add_heading('3. Specific Requirements', level=1)
    doc.add_heading('3.1 Functional Requirements', level=2)
    
    requirements = ProjectRequirement.query.filter_by(lead_id=lead.id).all()
    # Filter only Functional/Business
    for req in [r for r in requirements if r.category.name in ['Functional', 'Business', 'User Interface']]:
        p = doc.add_paragraph(style='List Bullet')
        run = p.add_run(f"{req.requirement_text}")
        p.add_run(f" (Priority: {req.priority})")

    # --- 5. NON-FUNCTIONAL REQUIREMENTS ---
    doc.add_heading('3.2 Non-Functional Requirements', level=2)
    # Filter for Technical/Security/Performance
    for req in [r for r in requirements if r.category.name in ['Technical', 'Security', 'Performance', 'Non-Functional']]:
        p = doc.add_paragraph(style='List Bullet')
        p.add_run(f"{req.category.name}: {req.requirement_text}")

    stream = BytesIO()
    doc.save(stream)
    stream.seek(0)
    return stream

# --- MARKDOWN SRS GENERATION FUNCTION (for database storage) ---
def generate_full_srs(lead):
    """Generates a comprehensive SRS document and saves it to database."""
    requirements = ProjectRequirement.query.filter_by(lead_id=lead.id).all()
    requirements_by_category = {}
    for req in requirements:
        cat_name = req.category.name if req.category else "Uncategorized"
        if cat_name not in requirements_by_category:
            requirements_by_category[cat_name] = []
        requirements_by_category[cat_name].append(req)
    
    srs_content = f"SOFTWARE REQUIREMENTS SPECIFICATION\n{'='*60}\nVersion: 1.0\nProject: {lead.project_name or 'Untitled Project'}\n"
    srs_content += f"2. PROJECT OVERVIEW\n2.1 Project Description: {lead.project_description or 'N/A'}\n"
    srs_content += "\n3. REQUIREMENTS BY CATEGORY\n"
    
    for category, reqs in requirements_by_category.items():
        srs_content += f"\n3.{list(requirements_by_category.keys()).index(category)+1} {category.upper()} REQUIREMENTS\n"
        for i, req in enumerate(reqs, 1):
            srs_content += f"\n3.{list(requirements_by_category.keys()).index(category)+1}.{i} {req.priority.upper()}: {req.requirement_text}\n"
            if req.description:
                srs_content += f" Description: {req.description}\n"
    
    srs_content += f"\n{'='*60}\n6. APPENDICES\n6.1 Conversation Transcript: {json.dumps(json.loads(lead.full_transcript), indent=2) if lead.full_transcript else 'No transcript available'}\nEND OF DOCUMENT\n"
    
    srs_doc = SRSDocument(
        lead_id=lead.id,
        title=f"SRS - {lead.project_name or 'Project'}",
        content=srs_content,
        summary=f"Software Requirements Specification for {lead.project_type} project",
        status="Draft",
        format_type="markdown"
    )
    db.session.add(srs_doc)
    db.session.commit()
    return srs_doc

# --- AGENT INITIALIZATION ---
agent_orchestrator = None
try:
    API_KEY = os.environ.get('GOOGLE_API_KEY')
    if not API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in environment variables.")
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite", temperature=0.3, api_key=API_KEY,
        max_retries=0, max_output_tokens=500, timeout=30 
    )
    print("Creating enhanced SRS Agent with simple LCEL...")
    llm_with_tools = llm.bind_tools(TOOLS)
    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=SRS_SYSTEM_PROMPT),
        ("placeholder", "{chat_history}"),
        ("user", "{input}"),
    ])
    agent_orchestrator = prompt | llm_with_tools
    print(f"✓ Enhanced SRS Agent initialized successfully!")
except Exception as e:
    print(f"Error initializing agent: {e}")
    agent_orchestrator = None

# --- SMART FILTERING FUNCTION ---
def should_use_llm(session_uuid, user_message):
    """Smart filtering to reduce API calls."""
    # Skip LLM for simple acknowledgments
    simple_responses = {
        "hi": "Hello! I'm your AI Requirements Assistant.",
        "hello": "Hello! Ready to gather your requirements.",
        "thanks": "You're welcome!",
        "thank you": "You're welcome!",
        "ok": "Great!",
        "okay": "Great!",
        "yes": "Please continue...",
        "no": "Alright, let me know if you change your mind.",
    }
    
    user_lower = user_message.lower().strip()
    if user_lower in simple_responses:
        return False, simple_responses[user_lower]
    
    return True, None

# --- ROUTES ---
@app.route('/api/chat', methods=['POST'])
def handle_chat():
    """Handle chat messages with AI agent."""
    data = request.get_json()
    session_uuid = data.get('session_uuid')
    user_message = data.get('user_message')

    # SMART FILTER - REDUCES API CALLS BY 30-40%
    should_call_llm, canned_response = should_use_llm(session_uuid, user_message)

    if not should_call_llm:
        return jsonify({
            "session_uuid": session_uuid,
            "ai_response": canned_response,
            "is_qualified": False,
            "is_srs_complete": False
        })
    
    if not session_uuid or not user_message or not agent_orchestrator:
        return jsonify({"error": "Missing data or Agent not initialized."}), 400
        
    with app.app_context():
        lead = db.session.execute(db.select(Lead).filter_by(session_uuid=session_uuid)).scalar_one_or_none()
        if not lead:
            return jsonify({"error": "Session not found"}), 404
            
        history_dicts = json.loads(lead.full_transcript or '[]')
        history_dicts.append({"role": "user", "parts": [user_message]})
        
        try:
            chat_history_messages = []
            for msg in history_dicts[:-1]:
                text = msg["parts"][0]
                if isinstance(text, dict): 
                    text = text.get('text', str(text))
                
                if msg["role"] == 'user':
                    chat_history_messages.append(HumanMessage(content=text))
                else:
                    chat_history_messages.append(AIMessage(content=text))
            
            result = agent_orchestrator.invoke({"input": user_message, "chat_history": chat_history_messages})
            
            # --- CRASH-PROOF TEXT EXTRACTION ---
            ai_response_text = ""
            if hasattr(result, 'content'):
                if isinstance(result.content, str):
                    ai_response_text = result.content
                elif isinstance(result.content, list):
                    ai_response_text = " ".join([p['text'] for p in result.content if isinstance(p, dict) and 'text' in p])
            
            if not ai_response_text: 
                ai_response_text = str(result.content)

            # --- PROCESS TOOLS (Updating Database Based on Tool Calls) ---
            if hasattr(result, 'tool_calls') and result.tool_calls:
                for tool_call in result.tool_calls:
                    tool_name = tool_call['name']
                    args = tool_call['args']
                    
                    if tool_name == 'save_lead_qualification':
                        lead.project_type = args.get('project_type')
                        lead.budget = args.get('budget')
                        lead.estimated_time_weeks = args.get('timeline')
                        lead.seriousness_score = args.get('seriousness_score')
                        lead.email = args.get('email')
                        lead.status = 'Qualified' 
                        ai_response_text = "✅ Qualification Complete! What is the **Name** of your project?"
                    
                    elif tool_name == 'save_project_overview':
                        lead.project_name = args.get('project_name')
                        lead.project_description = args.get('project_description')
                        # Convert comma-separated features/users into JSON lists for the dashboard
                        lead.target_users = json.dumps([u.strip() for u in args.get('target_users', '').split(',') if u.strip()])
                        lead.key_features = json.dumps([f.strip() for f in args.get('key_features', '').split(',') if f.strip()])
                        ai_response_text = f"Excellent! I've recorded the overview for **{lead.project_name}**. Now, let's list specific features one by one."

                    elif tool_name == 'save_requirement':
                        cat_name = args.get('category', 'Functional')
                        category = RequirementCategory.query.filter_by(name=cat_name).first() or RequirementCategory.query.first()
                        new_req = ProjectRequirement(
                            lead_id=lead.id,
                            category_id=category.id,
                            requirement_text=args.get('requirement_text'),
                            priority=args.get('priority', 'Should'),
                            status='Identified'
                        )
                        db.session.add(new_req)
                        ai_response_text = f"Got it. I've logged that {cat_name} requirement. What is the next feature?"

                    elif tool_name == 'generate_srs_document':
                        # Generate both docx (for download) and markdown (for database)
                        if not lead.project_name or not lead.email:
                           ai_response_text = "I can't generate the SRS yet because I'm missing your Project Name or Email. Let's finish those first!"
                        else:
                           docx_stream = generate_docx_srs(lead)
                           srs_doc = generate_full_srs(lead)
                           lead.status = 'SRS_Generated'
                           lead.srs_generated_at = datetime.utcnow()
                           db.session.commit()
                           ai_response_text = "🎉 I have compiled all your requirements into a formal SRS document!"

            # --- SAVE CLEAN TRANSCRIPT ---
            if "SIGNAL" not in ai_response_text:
                history_dicts.append({"role": "model", "parts": [ai_response_text]})
            
            lead.full_transcript = json.dumps(history_dicts)
            db.session.commit()

            return jsonify({
                "session_uuid": lead.session_uuid,
                "ai_response": ai_response_text,
                "is_qualified": lead.status in ['Qualified', 'SRS_Generated'],
                "is_srs_complete": lead.status == 'SRS_Generated'
            })
            
        except Exception as e:
            db.session.rollback()
            print(f"Error in handle_chat: {str(e)}")
            return jsonify({"error": str(e)}), 500

@app.route('/api/session/start', methods=['POST'])
def start_session():
    """Starts a new chat session and creates a Lead record, preventing duplicates from React Strict Mode."""
    try:
        with app.app_context():
            five_seconds_ago = datetime.utcnow() - timedelta(seconds=5)
            recent_lead_check = Lead.query.filter(Lead.created_at > five_seconds_ago).order_by(Lead.created_at.desc()).first()
            
            # Debounce logic: If a new lead (with empty transcript) was created just now, return it instead of creating a phantom copy.
            if recent_lead_check and recent_lead_check.full_transcript == '[]' and recent_lead_check.status == 'New':
                 # Use the existing session and send back a greeting message
                initial_message = "Welcome back! Continuing our requirements gathering..." 
                return jsonify({
                    "session_uuid": recent_lead_check.session_uuid,
                    "ai_response": initial_message,
                    "is_qualified": False
                }), 201

            # Normal creation
            new_lead = Lead(full_transcript=json.dumps([]))
            db.session.add(new_lead)
            db.session.commit()
            
            initial_message = "Welcome! I'm your AI Requirements Engineering Assistant. To get started, could you tell me a little about the **type of software project** you are looking to build?"

            return jsonify({
                "session_uuid": new_lead.session_uuid,
                "ai_response": initial_message,
                "is_qualified": False
            }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to start session", "details": str(e)}), 500

@app.route('/api/admin/report/<string:session_uuid>', methods=['GET'])
def download_report(session_uuid):
    """Generates and downloads a comprehensive SRS report."""
    print(f"DEBUG: Download request for UUID: {session_uuid}")
    print(f"DEBUG: Request URL: {request.url}")
    with app.app_context():
        session_uuid = session_uuid.strip()
        lead = Lead.query.filter_by(session_uuid=session_uuid).first()
        if not lead:
            return jsonify({"error": "Lead not found", "uuid_provided":session_uuid}), 404
        
        # Generate and return the docx file
        try:
            file_stream = generate_docx_srs(lead)
            filename = f"SRS_{lead.project_name or 'Project'}_{lead.session_uuid[:8]}.docx"
            return send_file(
                file_stream,
                as_attachment=True,
                download_name=f"SRS_{lead.project_name or 'Project'}.docx",
                mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )

        except Exception as e:
            print(f"Error generating SRS: {e}")
            return jsonify({"error": f"Failed to generate SRS: {str(e)}"}), 500


@app.route('/api/debug/uuid/<string:session_uuid>', methods=['GET'])
def debug_uuid(session_uuid):
    """Debug UUID parsing issues."""
    with app.app_context():
        # Try different ways to find the lead
        from uuid import UUID
        
        try:
            # Try as string
            lead_str = Lead.query.filter_by(session_uuid=session_uuid).first()
            
            # Try with UUID object
            uuid_obj = UUID(session_uuid)
            lead_uuid = Lead.query.filter_by(session_uuid=str(uuid_obj)).first()
            
            return jsonify({
                "input_uuid": session_uuid,
                "as_string_found": lead_str is not None,
                "as_uuid_object_found": lead_uuid is not None,
                "all_uuids_in_db": [str(l.session_uuid) for l in Lead.query.limit(10).all()]
            })
        except Exception as e:
            return jsonify({"error": str(e), "input": session_uuid}), 400


@app.route('/api/admin/lead/<uuid:session_uuid>/generate-srs', methods=['POST'])
def manual_generate_srs(session_uuid):
    """Manually triggers SRS generation and updates the lead status."""
    # NOTE: You MUST enforce authentication middleware here in a real application!
    with app.app_context():
        lead = db.session.execute(
            db.select(Lead).filter_by(session_uuid=session_uuid)
        ).scalar_one_or_none()

        if not lead:
            return jsonify({"error": "Lead not found"}), 404
        
        try:
            # Generate both docx and markdown versions
            docx_stream = generate_docx_srs(lead)
            srs_doc = generate_full_srs(lead)
            lead.status = 'SRS_Generated'
            lead.srs_generated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({"message": f"SRS generation triggered successfully for {lead.project_name or lead.email}"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to generate SRS: {str(e)}"}), 500

@app.route('/api/admin/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    # Keeping this simplified dashboard endpoint
    with app.app_context():
        total_leads = db.session.scalar(db.select(db.func.count(Lead.id)))
        
        status_data = db.session.execute(db.select(Lead.status, db.func.count(Lead.id).label('count')).group_by(Lead.status)).mappings().all()

        total_requirements = db.session.scalar(db.select(db.func.count(ProjectRequirement.id)))
        avg_requirements_per_lead = total_requirements / total_leads if total_leads > 0 else 0
        
        srs_generated = db.session.scalar(db.select(db.func.count(SRSDocument.id)))
        
        type_data = db.session.execute(db.select(Lead.project_type, db.func.count(Lead.id).label('count')).where(Lead.status == 'Qualified').group_by(Lead.project_type)).mappings().all()
        
        recent_leads = db.session.execute(db.select(Lead).order_by(Lead.created_at.desc()).limit(5)).scalars().all()
        
        volume_data = db.session.execute(db.select(db.func.strftime('%Y-%m-%d', Lead.created_at).label('date'), db.func.count(Lead.id).label('count')).group_by('date').order_by('date').limit(30)).mappings().all()
        
    return jsonify({
        "total_leads": total_leads,
        "status_distribution": [dict(s) for s in status_data],
        "project_type_distribution": [dict(t) for t in type_data],
        "total_requirements": total_requirements,
        "avg_requirements_per_lead": round(avg_requirements_per_lead, 2),
        "srs_documents_generated": srs_generated,
        "volume_by_day": [dict(v) for v in volume_data],
        "recent_leads": [{
            'id': lead.id, 'session_uuid': lead.session_uuid, 'project_name': lead.project_name or 'Unnamed', 
            'status': lead.status, 'email': lead.email
        } for lead in recent_leads]
    })

@app.route('/api/admin/leads', methods=['GET'])
def get_lead_list():
    with app.app_context():
        # Eagerly load requirements to calculate count in to_dict without hitting SQLA DetachedInstanceError
        leads = db.session.execute(db.select(Lead).order_by(Lead.created_at.desc())).scalars().all()
        lead_list = [lead.to_dict() for lead in leads]
    return jsonify(lead_list)

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    ADMIN_USER = os.environ.get('ADMIN_USER', 'admin')
    ADMIN_PASS = os.environ.get('ADMIN_PASS', 'securepassword')

    if username == ADMIN_USER and password == ADMIN_PASS:
        auth_token = str(uuid4()) 
        return jsonify({"message": "Login successful", "token": auth_token, "username": ADMIN_USER}), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401
    
@app.route('/')
def health_check():
    return {"status": "ok", "service": "AI Requirements Engineering Platform"}

if __name__ == '__main__':
    with app.app_context():
        import sys
        if len(sys.argv) > 1 and sys.argv[1] == 'reset':
            db.drop_all()
            print("🗑️ Database reset")
        
        db.create_all()
        initialize_categories()
        print("✅ Database ready")
    app.run(debug=True, port=5000, use_reloader=False)

# # server/app.py - FINAL SIMPLIFIED AND STABLE VERSION

# from flask import Flask, request, jsonify, make_response
# from flask_cors import CORS
# from dotenv import load_dotenv
# import os
# import json
# from uuid import uuid4, UUID
# import inspect
# from datetime import datetime, timedelta # Added timedelta
# from sqlalchemy.orm import joinedload 
# from sqlalchemy import case, func

# # --- DEPENDENCY IMPORTS ---
# from docx import Document
# from docx.shared import Pt, Inches
# from io import BytesIO

# # --- LANGCHAIN AGENT ORCHESTRATION IMPORTS ---

# from langchain_core.prompts import ChatPromptTemplate
# from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain_core.tools import tool
# from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# # --- DATABASE IMPORTS ---
# from database import db
# from models import Lead, RequirementCategory, ProjectRequirement, SRSDocument

# from google.api_core.exceptions import ResourceExhausted

# # Load environment variables
# load_dotenv()

# app = Flask(__name__)
# CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}}) 

# # --- Configuration ---
# app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///leads.db')
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# db.init_app(app) 

# # --- INITIALIZATION FUNCTIONS ---

# def initialize_categories():
#     # This must remain for ProjectRequirement insertion to work, 
#     # even if we don't expose the endpoints
#     with app.app_context():
#         categories = [
#             ("Functional", "Features and functions the system must perform", "#0088FE"),
#             ("Non-Functional", "Quality attributes and constraints", "#00C49F"),
#             ("Technical", "Technical specifications and constraints", "#FFBB28"),
#             ("User Interface", "UI/UX requirements", "#FF8042"),
#             ("Business", "Business rules and processes", "#8884D8"),
#             ("Security", "Security and privacy requirements", "#82CA9D"),
#             ("Performance", "Performance and scalability requirements", "#FFC658"),
#         ]
        
#         for name, description, color in categories:
#             if not RequirementCategory.query.filter_by(name=name).first():
#                 category = RequirementCategory(name=name, description=description, color=color)
#                 db.session.add(category)
        
#         db.session.commit()
#         print("✓ Requirement categories initialized")

# # --- AGENT PROMPT AND TOOLS (Unchanged) ---
# SRS_SYSTEM_PROMPT = """
# You are an AI Requirements Assistant.
# STRICT RULES:
# 1. Ask exactly ONE question per message.
# 2. Wait for the user to answer before asking the next thing.
# 3. NEVER provide lists or multiple bullet points of questions.

# PHASE 1 (Qualification): Ask 1.Type, then 2.Budget, then 3.Timeline, then 4.Score, then 5.Email.
# PHASE 2 (SRS): Gather Project Name, then Description, then Users, then Features one-by-one.
# """

# @tool
# def save_lead_qualification(project_type: str, budget: str, timeline: str, seriousness_score: int, email: str) -> str:
#     """
#     Saves qualification data and moves to requirements gathering phase.
#     """
#     return f"QUALIFICATION_COMPLETE|type:{project_type}|budget:{budget}|timeline:{timeline}|score:{seriousness_score}|email:{email}"

# @tool
# def save_requirement(
#     requirement_text: str,
#     category: str = "Functional",
#     priority: str = "Should",
# ) -> str:
#     """
#     Saves an individual requirement to the database. Categories: Functional, Non-Functional, Technical, User Interface, Business, Security, Performance
#     """
#     return f"REQUIREMENT_SAVED|category:{category}|text:{requirement_text[:50]}...|priority:{priority}"

# @tool  
# def save_project_overview(
#     project_name: str,
#     project_description: str,
#     target_users: str,
#     key_features: str
# ) -> str:
#     """
#     Saves high-level project overview information.
#     """
#     return f"PROJECT_OVERVIEW_SAVED|name:{project_name}|desc:{project_description[:50]}..."

# @tool
# def generate_srs_document(lead_id: str) -> str:
#     """
#     Signals that requirements gathering is complete and triggers the server to generate the SRS document.
#     """
#     return f"SRS_GENERATED|lead_id:{lead_id}|status:initiated"

# TOOLS = [save_lead_qualification, save_requirement, save_project_overview, generate_srs_document]


# def generate_docx_srs(lead):
#     """Generates a professional .docx SRS document for the given lead."""
#     doc = Document()

#     # 1. Title Section
#     title = doc.add_heading(f'Software Requirements Specification', 0)
#     doc.add_heading(f'Project: {lead.project_name or "Unnamed Project"}', level=1)
#     doc.add_paragraph(f"Generated on: {datetime.utcnow().strftime('%B %d, %Y')}")

#     # 2. Project Overview
#     doc.add_heading('1. Introduction', level=1)
#     doc.add_heading('1.1 Project Description', level=2)
#     doc.add_paragraph(lead.project_description or "No description provided.")

#     # 3. Target Users
#     doc.add_heading('1.2 Target Audience', level=2)
#     users_data = json.loads(lead.target_users or '[]')
#     if users_data:
#         for user in users_data:
#             doc.add_paragraph(user, style='List Bullet')
#     else:
#         doc.add_paragraph("General Users")

#     # 4. Functional Requirements
#     doc.add_heading('2. System Requirements', level=1)
    
#     # We group requirements by their stored category
#     requirements = ProjectRequirement.query.filter_by(lead_id=lead.id).all()
    
#     if not requirements:
#         doc.add_paragraph("No specific features recorded yet.")
#     else:
#         for req in requirements:
#             cat_name = req.category.name if req.category else "General"
#             p = doc.add_paragraph(style='List Bullet')
#             run = p.add_run(f"[{cat_name}] ")
#             run.bold = True
#             p.add_run(f"{req.requirement_text} (Priority: {req.priority})")

#     # Save to a memory stream for the download route
#     file_stream = BytesIO()
#     doc.save(file_stream)
#     file_stream.seek(0)
#     return file_stream

# # --- AGENT INITIALIZATION (Unchanged) ---
# agent_orchestrator = None
# try:
#     API_KEY = os.environ.get('GOOGLE_API_KEY')
#     if not API_KEY:
#         raise ValueError("GOOGLE_API_KEY not found in environment variables.")
#     llm = ChatGoogleGenerativeAI(
#         model="gemini-2.5-flash-lite", temperature=0.3, api_key=API_KEY, google_api_key=os.environ.get('GOOGLE_API_KEY'),
#         max_retries=0, max_output_tokens=500, timeout=30 
#     )
#     print("Creating enhanced SRS Agent with simple LCEL...")
#     llm_with_tools = llm.bind_tools(TOOLS)
#     prompt = ChatPromptTemplate.from_messages([
#         SystemMessage(content=SRS_SYSTEM_PROMPT),
#         ("placeholder", "{chat_history}"),
#         ("user", "{input}"),
#     ])
#     agent_orchestrator = prompt | llm_with_tools
#     print(f"✓ Enhanced SRS Agent initialized successfully!")
# except Exception as e:
#     print(f"Error initializing agent: {e}")
#     agent_orchestrator = None


# def should_use_llm(session_uuid, user_message):
#     """Smart filtering to reduce API calls."""
#     # Skip LLM for simple acknowledgments
#     simple_responses = {
#         "hi": "Hello! I'm your AI Requirements Assistant.",
#         "hello": "Hello! Ready to gather your requirements.",
#         "thanks": "You're welcome!",
#         "thank you": "You're welcome!",
#         "ok": "Great!",
#         "okay": "Great!",
#         "yes": "Please continue...",
#         "no": "Alright, let me know if you change your mind.",
#     }
    
#     user_lower = user_message.lower().strip()
#     if user_lower in simple_responses:
#         return False, simple_responses[user_lower]
    
#     return True, None







# # --- SRS GENERATION FUNCTION (Unchanged) ---
# def generate_full_srs(lead):
#     """Generates a comprehensive SRS document."""
#     # ... (Your existing generate_full_srs logic) ...
#     requirements = ProjectRequirement.query.filter_by(lead_id=lead.id).all()
#     requirements_by_category = {}
#     for req in requirements:
#         cat_name = req.category.name if req.category else "Uncategorized"
#         if cat_name not in requirements_by_category:
#             requirements_by_category[cat_name] = []
#         requirements_by_category[cat_name].append(req)
    
#     srs_content = f"SOFTWARE REQUIREMENTS SPECIFICATION\n{'='*60}\nVersion: 1.0\nProject: {lead.project_name or 'Untitled Project'}\n"
#     srs_content += f"2. PROJECT OVERVIEW\n2.1 Project Description: {lead.project_description or 'N/A'}\n"
#     srs_content += "\n3. REQUIREMENTS BY CATEGORY\n"
    
#     for category, reqs in requirements_by_category.items():
#         srs_content += f"\n3.{list(requirements_by_category.keys()).index(category)+1} {category.upper()} REQUIREMENTS\n"
#         for i, req in enumerate(reqs, 1):
#             srs_content += f"\n3.{list(requirements_by_category.keys()).index(category)+1}.{i} {req.priority.upper()}: {req.requirement_text}\n"
#             if req.description:
#                 srs_content += f" Description: {req.description}\n"
    
#     srs_content += f"\n{'='*60}\n6. APPENDICES\n6.1 Conversation Transcript: {json.dumps(json.loads(lead.full_transcript), indent=2) if lead.full_transcript else 'No transcript available'}\nEND OF DOCUMENT\n"
    
#     srs_doc = SRSDocument(
#         lead_id=lead.id,
#         title=f"SRS - {lead.project_name or 'Project'}",
#         content=srs_content,
#         summary=f"Software Requirements Specification for {lead.project_type} project",
#         status="Draft",
#         format_type="markdown"
#     )
#     db.session.add(srs_doc)
#     db.session.commit()
#     return srs_doc

# SRS_SYSTEM_PROMPT = """
# You are an AI Requirements Assistant.
# STRICT RULES:
# 1. Ask exactly ONE question per message.
# 2. Wait for the user to answer before asking the next thing.
# 3. NEVER provide lists or multiple bullet points of questions.

# PHASE 1 (Qualification): Ask 1.Type, then 2.Budget, then 3.Timeline, then 4.Score, then 5.Email.
# PHASE 2 (SRS): Gather Project Name, then Description, then Users, then Features one-by-one.
# """

# @app.route('/api/chat', methods=['POST'])
# def handle_chat():
#     data = request.get_json()
#     session_uuid = data.get('session_uuid')
#     user_message = data.get('user_message')

#     # SMART FILTER - REDUCES API CALLS BY 30-40%
#     should_call_llm, canned_response = should_use_llm(session_uuid, user_message)

#     if not should_call_llm:
#         return jsonify({
#             "session_uuid": session_uuid,
#             "ai_response": canned_response,
#             "is_qualified": False,
#             "is_srs_complete": False
#         })
    
#     if not session_uuid or not user_message or not agent_orchestrator:
#         return jsonify({"error": "Missing data or Agent not initialized."}), 400
        
#     with app.app_context():
#         lead = db.session.execute(db.select(Lead).filter_by(session_uuid=session_uuid)).scalar_one_or_none()
#         if not lead:
#             return jsonify({"error": "Session not found"}), 404
            
#         history_dicts = json.loads(lead.full_transcript or '[]')
#         history_dicts.append({"role": "user", "parts": [user_message]})
        
#         try:
#             chat_history_messages = []
#             for msg in history_dicts[:-1]:
#                 text = msg["parts"][0]
#                 # Ensure we handle cases where old history might still be objects
#                 if isinstance(text, dict): text = text.get('text', str(text))
                
#                 if msg["role"] == 'user':
#                     chat_history_messages.append(HumanMessage(content=text))
#                 else:
#                     chat_history_messages.append(AIMessage(content=text))
            
#             result = agent_orchestrator.invoke({"input": user_message, "chat_history": chat_history_messages})
            
#             # --- CRASH-PROOF TEXT EXTRACTION ---
#             ai_response_text = ""
#             if hasattr(result, 'content'):
#                 if isinstance(result.content, str):
#                     ai_response_text = result.content
#                 elif isinstance(result.content, list):
#                     # Filter and join only text parts to ignore "signatures"
#                     ai_response_text = " ".join([p['text'] for p in result.content if isinstance(p, dict) and 'text' in p])
            
#             # If still empty, fallback to raw content or stringified result
#             if not ai_response_text: ai_response_text = str(result.content)

#             # --- PROCESS TOOLS (Using clean ai_response_text) ---
#             if hasattr(result, 'tool_calls') and result.tool_calls:
#                 for tool_call in result.tool_calls:
#                     tool_name = tool_call['name']
#                     args = tool_call['args']
                    
#                     if tool_name == 'save_lead_qualification':
#                         # Internal signal to update DB, user doesn't see this string
#                         lead.project_type = args.get('project_type')
#                         lead.budget = args.get('budget')
#                         lead.estimated_time_weeks = args.get('timeline')
#                         lead.seriousness_score = args.get('seriousness_score')
#                         lead.email = args.get('email')
    
#                         # Critical: Change the status so the dashboard and AI know Phase 1 is done
#                         lead.status = 'Qualified' 
#                         db.session.commit()
#                         # ... (add your existing qualification logic here) ...
#                         ai_response_text = "✅ Qualification Complete! What is the **Name** of your project?"
                    
#                     elif tool_name == 'save_requirement':
#                         # ... (your existing save_requirement logic) ...
#                         pass # Database logic remains the same

#             # --- SAVE CLEAN TEXT ONLY ---
#             # Don't save internal signals or signatures to the transcript
#             if "SIGNAL" not in ai_response_text:
#                 history_dicts.append({"role": "model", "parts": [ai_response_text]})
            
#             lead.full_transcript = json.dumps(history_dicts)
#             db.session.commit()

#             return jsonify({
#                 "session_uuid": lead.session_uuid,
#                 "ai_response": ai_response_text,
#                 "is_qualified": lead.status in ['Qualified', 'SRS_Generated'],
#                 "is_srs_complete": lead.status == 'SRS_Generated'
#             })
            
#         except Exception as e:
#             db.session.rollback()
#             print(f"Error in handle_chat: {str(e)}") # This will show in your terminal
#             return jsonify({"error": str(e)}), 500



# @app.route('/api/chat', methods=['POST'])
# def handle_chat():
#     data = request.get_json()
#     session_uuid = data.get('session_uuid')
#     user_message = data.get('user_message')

#     # SMART FILTER - REDUCES API CALLS BY 30-40%
#     should_call_llm, canned_response = should_use_llm(session_uuid, user_message)

#     if not should_call_llm:
#         return jsonify({
#             "session_uuid": session_uuid,
#             "ai_response": canned_response,
#             "is_qualified": False,
#             "is_srs_complete": False
#         })
    
#     if not session_uuid or not user_message or not agent_orchestrator:
#         return jsonify({"error": "Missing data or Agent not initialized."}), 400
        
#     with app.app_context():
#         lead = db.session.execute(db.select(Lead).filter_by(session_uuid=session_uuid)).scalar_one_or_none()
#         if not lead:
#             return jsonify({"error": "Session not found"}), 404
            
#         history_dicts = json.loads(lead.full_transcript or '[]')
#         history_dicts.append({"role": "user", "parts": [user_message]})
        
#         try:
#             chat_history_messages = []
#             for msg in history_dicts[:-1]:
#                 text = msg["parts"][0]
#                 if isinstance(text, dict): text = text.get('text', str(text))
                
#                 if msg["role"] == 'user':
#                     chat_history_messages.append(HumanMessage(content=text))
#                 else:
#                     chat_history_messages.append(AIMessage(content=text))
            
#             result = agent_orchestrator.invoke({"input": user_message, "chat_history": chat_history_messages})
            
#             # --- CRASH-PROOF TEXT EXTRACTION ---
#             ai_response_text = ""
#             if hasattr(result, 'content'):
#                 if isinstance(result.content, str):
#                     ai_response_text = result.content
#                 elif isinstance(result.content, list):
#                     ai_response_text = " ".join([p['text'] for p in result.content if isinstance(p, dict) and 'text' in p])
            
#             if not ai_response_text: ai_response_text = str(result.content)

#             # --- PROCESS TOOLS (Updating Database Based on Tool Calls) ---
#             if hasattr(result, 'tool_calls') and result.tool_calls:
#                 for tool_call in result.tool_calls:
#                     tool_name = tool_call['name']
#                     args = tool_call['args']
                    
#                     if tool_name == 'save_lead_qualification':
#                         lead.project_type = args.get('project_type')
#                         lead.budget = args.get('budget')
#                         lead.estimated_time_weeks = args.get('timeline')
#                         lead.seriousness_score = args.get('seriousness_score')
#                         lead.email = args.get('email')
#                         lead.status = 'Qualified' 
#                         ai_response_text = "✅ Qualification Complete! What is the **Name** of your project?"
                    
#                     elif tool_name == 'save_project_overview':
#                         lead.project_name = args.get('project_name')
#                         lead.project_description = args.get('project_description')
#                         # Convert comma-separated features/users into JSON lists for the dashboard
#                         lead.target_users = json.dumps([u.strip() for u in args.get('target_users', '').split(',') if u.strip()])
#                         lead.key_features = json.dumps([f.strip() for f in args.get('key_features', '').split(',') if f.strip()])
#                         ai_response_text = f"Excellent! I've recorded the overview for **{lead.project_name}**. Now, let's list specific features one by one."

#                     elif tool_name == 'save_requirement':
#                         cat_name = args.get('category', 'Functional')
#                         category = RequirementCategory.query.filter_by(name=cat_name).first() or RequirementCategory.query.first()
#                         new_req = ProjectRequirement(
#                             lead_id=lead.id,
#                             category_id=category.id,
#                             requirement_text=args.get('requirement_text'),
#                             priority=args.get('priority', 'Should'),
#                             status='Identified'
#                         )
#                         db.session.add(new_req)
#                         ai_response_text = f"Got it. I've logged that {cat_name} requirement. What is the next feature?"

#                     elif tool_name == 'generate_srs_document':
#                         # Trigger document generation helper
#                         lead.status = 'SRS_Generated'
#                         generate_full_srs(lead)
#                         db.session.commit()
#                         ai_response_text = "🎉 I have compiled all your requirements into a formal SRS document! You can download it from the dashboard."

#             # --- SAVE CLEAN TRANSCRIPT ---
#             if "SIGNAL" not in ai_response_text:
#                 history_dicts.append({"role": "model", "parts": [ai_response_text]})
            
#             lead.full_transcript = json.dumps(history_dicts)
#             db.session.commit()

#             return jsonify({
#                 "session_uuid": lead.session_uuid,
#                 "ai_response": ai_response_text,
#                 "is_qualified": lead.status in ['Qualified', 'SRS_Generated'],
#                 "is_srs_complete": lead.status == 'SRS_Generated'
#             })
            
#         except Exception as e:
#             db.session.rollback()
#             print(f"Error in handle_chat: {str(e)}")
#             return jsonify({"error": str(e)}), 500



# @app.route('/api/session/start', methods=['POST'])
# def start_session():
#     """Starts a new chat session and creates a Lead record, preventing duplicates from React Strict Mode."""
#     try:
#         with app.app_context():
#             five_seconds_ago = datetime.utcnow() - timedelta(seconds=5)
#             recent_lead_check = Lead.query.filter(Lead.created_at > five_seconds_ago).order_by(Lead.created_at.desc()).first()
            
#             # Debounce logic: If a new lead (with empty transcript) was created just now, return it instead of creating a phantom copy.
#             if recent_lead_check and recent_lead_check.full_transcript == '[]' and recent_lead_check.status == 'New':
#                  # Use the existing session and send back a greeting message
#                 initial_message = "Welcome back! Continuing our requirements gathering..." 
#                 return jsonify({
#                     "session_uuid": recent_lead_check.session_uuid,
#                     "ai_response": initial_message,
#                     "is_qualified": False
#                 }), 201

#             # Normal creation
#             new_lead = Lead(full_transcript=json.dumps([]))
#             db.session.add(new_lead)
#             db.session.commit()
            
#             initial_message = "Welcome! I'm your AI Requirements Engineering Assistant. To get started, could you tell me a little about the **type of software project** you are looking to build?"

#             return jsonify({
#                 "session_uuid": new_lead.session_uuid,
#                 "ai_response": initial_message,
#                 "is_qualified": False
#             }), 201
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": "Failed to start session", "details": str(e)}), 500


# @app.route('/api/admin/report/<uuid:session_uuid>', methods=['GET'])
# def download_report(session_uuid):
#     """Generates and downloads a comprehensive SRS report."""
#     with app.app_context():
#         lead = Lead.query.filter_by(session_uuid=session_uuid).first()
#         if not lead:
#             return jsonify({"error": "Lead not found"}), 404
        
#         file_stream = generate_docx_srs(lead)
#         return send_file(
#             file_stream,
#             as_attachment=True,
#             download_name=f"SRS_{lead.project_name or 'Project'}.docx",
#             mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
#         )
        
#         # Ensure SRS exists or generate it
#         # srs = SRSDocument.query.filter_by(lead_id=lead.id).order_by(SRSDocument.generated_at.desc()).first()
#         # if not srs:
#         #     srs = generate_full_srs(lead)

#         # srs_content_string = srs.content 
        
#         # response = make_response(srs_content_string)
#         # response.headers["Content-Disposition"] = f"attachment; filename=SRS_{lead.project_name or lead.session_uuid}.md"
#         # response.mimetype = "text/markdown"
        
#         # return response

# @app.route('/api/admin/lead/<uuid:session_uuid>/generate-srs', methods=['POST'])
# def manual_generate_srs(session_uuid):
#     """Manually triggers SRS generation and updates the lead status."""
#     # NOTE: You MUST enforce authentication middleware here in a real application!
#     with app.app_context():
#         lead = db.session.execute(
#             db.select(Lead).filter_by(session_uuid=session_uuid)
#         ).scalar_one_or_none()

#         if not lead:
#             return jsonify({"error": "Lead not found"}), 404
        
#         try:
#             generate_full_srs(lead)
#             lead.status = 'SRS_Generated'
#             db.session.commit()
            
#             return jsonify({"message": f"SRS generation triggered successfully for {lead.project_name or lead.email}"}), 200
#         except Exception as e:
#             db.session.rollback()
#             return jsonify({"error": f"Failed to generate SRS: {str(e)}"}), 500



# @app.route('/api/admin/dashboard/summary', methods=['GET'])
# def get_dashboard_summary():
#     # Keeping this simplified dashboard endpoint
#     with app.app_context():
#         total_leads = db.session.scalar(db.select(db.func.count(Lead.id)))
        
#         status_data = db.session.execute(db.select(Lead.status, db.func.count(Lead.id).label('count')).group_by(Lead.status)).mappings().all()

#         total_requirements = db.session.scalar(db.select(db.func.count(ProjectRequirement.id)))
#         avg_requirements_per_lead = total_requirements / total_leads if total_leads > 0 else 0
        
#         srs_generated = db.session.scalar(db.select(db.func.count(SRSDocument.id)))
        
#         type_data = db.session.execute(db.select(Lead.project_type, db.func.count(Lead.id).label('count')).where(Lead.status == 'Qualified').group_by(Lead.project_type)).mappings().all()
        
#         recent_leads = db.session.execute(db.select(Lead).order_by(Lead.created_at.desc()).limit(5)).scalars().all()
        
#         volume_data = db.session.execute(db.select(db.func.strftime('%Y-%m-%d', Lead.created_at).label('date'), db.func.count(Lead.id).label('count')).group_by('date').order_by('date').limit(30)).mappings().all()
        
#     return jsonify({
#         "total_leads": total_leads,
#         "status_distribution": [dict(s) for s in status_data],
#         "project_type_distribution": [dict(t) for t in type_data],
#         "total_requirements": total_requirements,
#         "avg_requirements_per_lead": round(avg_requirements_per_lead, 2),
#         "srs_documents_generated": srs_generated,
#         "volume_by_day": [dict(v) for v in volume_data],
#         "recent_leads": [{
#             'id': lead.id, 'session_uuid': lead.session_uuid, 'project_name': lead.project_name or 'Unnamed', 
#             'status': lead.status, 'email': lead.email
#         } for lead in recent_leads]
#     })

# @app.route('/api/admin/leads', methods=['GET'])
# def get_lead_list():
#     with app.app_context():
#         # Eagerly load requirements to calculate count in to_dict without hitting SQLA DetachedInstanceError
#         leads = db.session.execute(db.select(Lead).order_by(Lead.created_at.desc())).scalars().all()
#         lead_list = [lead.to_dict() for lead in leads]
#     return jsonify(lead_list)

# @app.route('/api/admin/login', methods=['POST'])
# def admin_login():
#     data = request.get_json()
#     username = data.get('username')
#     password = data.get('password')

#     ADMIN_USER = os.environ.get('ADMIN_USER', 'admin')
#     ADMIN_PASS = os.environ.get('ADMIN_PASS', 'securepassword')

#     if username == ADMIN_USER and password == ADMIN_PASS:
#         auth_token = str(uuid4()) 
#         return jsonify({"message": "Login successful", "token": auth_token, "username": ADMIN_USER}), 200
#     else:
#         return jsonify({"message": "Invalid credentials"}), 401
    
# @app.route('/')
# def health_check():
#     return {"status": "ok", "service": "AI Requirements Engineering Platform"}

# if __name__ == '__main__':
#     with app.app_context():
#         import sys
#         if len(sys.argv) > 1 and sys.argv[1] == 'reset':
#             db.drop_all()
#             print("🗑️ Database reset")
        
#         db.create_all()
#         initialize_categories()
#         print("✅ Database ready")
#     app.run(debug=True, port=5000, use_reloader=False)

