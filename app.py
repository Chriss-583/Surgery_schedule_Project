from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from datetime import datetime
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# User Model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'admin', 'doctor', 'patient'
    
    # Add relationships
    surgeries_as_doctor = db.relationship('Surgery', foreign_keys='Surgery.doctor_id', backref='doctor', lazy=True)
    surgeries_as_patient = db.relationship('Surgery', foreign_keys='Surgery.patient_id', backref='patient', lazy=True)
    medical_records = db.relationship('MedicalRecord', backref='patient', lazy=True)

# Surgery Model
class Surgery(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    surgery_type = db.Column(db.String(120), nullable=False)
    scheduled_time = db.Column(db.DateTime, nullable=False)

# Medical Record Model
class MedicalRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    diagnosis = db.Column(db.String(200), nullable=False)
    treatment = db.Column(db.String(200), nullable=False)
    medications = db.Column(db.String(200), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and user.password == password:
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        role = request.form['role']
        new_user = User(username=username, password=password, role=role)
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user=current_user)

@app.route('/schedule_surgery', methods=['GET', 'POST'])
@login_required
def schedule_surgery():
    # Check if user is a patient - if so, deny access
    if current_user.role == 'patient':
        flash('Patients do not have permission to schedule surgeries')
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        patient_id = request.form['patient_id']
        doctor_id = request.form['doctor_id']
        surgery_type = request.form['surgery_type']
        scheduled_time = datetime.strptime(request.form['scheduled_time'], '%Y-%m-%dT%H:%M')
        new_surgery = Surgery(patient_id=patient_id, doctor_id=doctor_id, surgery_type=surgery_type, scheduled_time=scheduled_time)
        db.session.add(new_surgery)
        db.session.commit()
        return redirect(url_for('view_surgeries'))
    
    # Get all patients and doctors for the form
    patients = User.query.filter_by(role='patient').all()
    doctors = User.query.filter_by(role='doctor').all()
    return render_template('schedule_surgery.html', patients=patients, doctors=doctors)

@app.route('/view_surgeries')
@login_required
def view_surgeries():
    if current_user.role == 'patient':
        # Patients can only see their own surgeries
        surgeries = Surgery.query.filter_by(patient_id=current_user.id).all()
    else:
        # Admins and doctors can see all surgeries
        surgeries = Surgery.query.all()
    return render_template('view_surgeries.html', surgeries=surgeries)

@app.route('/patient_info')
@login_required
def patient_info():
    patients = User.query.filter_by(role='patient').all()
    return render_template('patient_info.html', patients=patients)

@app.route('/doctor_info')
@login_required
def doctor_info():
    doctors = User.query.filter_by(role='doctor').all()
    return render_template('doctor_info.html', doctors=doctors)

@app.route('/medical_records')
@login_required
def medical_records():
    if current_user.role == 'patient':
        # Patients can only see their own medical records
        records = MedicalRecord.query.filter_by(patient_id=current_user.id).all()
    else:
        # Admins and doctors can see all medical records
        records = MedicalRecord.query.all()
    
    patients = User.query.filter_by(role='patient').all()
    return render_template('medical_records.html', records=records, patients=patients)

@app.route('/add_medical_record', methods=['GET', 'POST'])
@login_required
def add_medical_record():
    # Check if user is a patient - if so, deny access
    if current_user.role == 'patient':
        flash('Patients do not have permission to add medical records')
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        patient_id = request.form['patient_id']
        diagnosis = request.form['diagnosis']
        treatment = request.form['treatment']
        medications = request.form['medications']
        notes = request.form['notes']
        
        new_record = MedicalRecord(
            patient_id=patient_id,
            diagnosis=diagnosis,
            treatment=treatment,
            medications=medications,
            notes=notes
        )
        
        db.session.add(new_record)
        db.session.commit()
        flash('Medical record added successfully')
        return redirect(url_for('medical_records'))
    
    # Get all patients for the form
    patients = User.query.filter_by(role='patient').all()
    return render_template('add_medical_record.html', patients=patients)

@app.route('/view_patient_medical_data/<int:patient_id>')
@login_required
def view_patient_medical_data(patient_id):
    # Check if user has permission
    if current_user.role == 'patient' and current_user.id != patient_id:
        flash('You do not have permission to view this patient\'s data')
        return redirect(url_for('dashboard'))
    
    patient = User.query.get_or_404(patient_id)
    records = MedicalRecord.query.filter_by(patient_id=patient_id).all()
    surgeries = Surgery.query.filter_by(patient_id=patient_id).all()
    
    return render_template('patient_medical_data.html', 
                           patient=patient, 
                           records=records, 
                           surgeries=surgeries)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

# Create the database and add default admin user
def init_db():
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Check if admin user already exists
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            # Create default admin user
            admin = User(
                username='admin',
                password='admin123',  # In production, use proper password hashing
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            print("Default admin user created.")
            print("Admin Username: admin")
            print("Admin Password: admin123")

if __name__ == '__main__':
    # Initialize the database and create admin user
    init_db()
    print("\nInnovative Hospital Management: A real time surgery scheduling System is running!")
    print("You can log in with the following admin credentials:")
    print("Username: admin")
    print("Password: admin123")
    app.run(debug=True)