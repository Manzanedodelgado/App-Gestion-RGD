"""
Google Sheets Service
Handles reading appointments from Google Sheets
"""
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from datetime import datetime
from typing import List, Dict

class GoogleSheetsService:
    def __init__(self):
        self.spreadsheet_id = os.getenv('GOOGLE_SHEET_ID')
        self.credentials_file = '/app/backend/credentials.json'
        self.service = self._initialize_service()
    
    def _initialize_service(self):
        """Initialize Google Sheets API service"""
        try:
            credentials = service_account.Credentials.from_service_account_file(
                self.credentials_file,
                scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
            )
            return build('sheets', 'v4', credentials=credentials)
        except Exception as e:
            print(f"Error initializing Google Sheets service: {e}")
            return None
    
    async def get_all_appointments(self) -> List[Dict]:
        """Get all appointments from Google Sheets"""
        if not self.service:
            return []
        
        try:
            # Read from "Hoja 1" range A:N
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range='Hoja 1!A:N'
            ).execute()
            
            values = result.get('values', [])
            
            if not values:
                return []
            
            # First row is headers
            headers = values[0]
            appointments = []
            
            for row in values[1:]:
                if len(row) < 14:
                    continue
                
                try:
                    appointment = {
                        'registro': row[0] if len(row) > 0 else '',
                        'citMod': row[1] if len(row) > 1 else '',
                        'numHis': row[2] if len(row) > 2 else '',
                        'numPac': row[3] if len(row) > 3 else '',
                        'apellidos': row[4] if len(row) > 4 else '',
                        'nombre': row[5] if len(row) > 5 else '',
                        'telMovil': row[6] if len(row) > 6 else '',
                        'fecha': row[7] if len(row) > 7 else '',
                        'hora': row[8] if len(row) > 8 else '',
                        'estadoCita': row[9] if len(row) > 9 else '',
                        'tratamiento': row[10] if len(row) > 10 else '',
                        'odontologo': row[11] if len(row) > 11 else '',
                        'duracion': row[12] if len(row) > 12 else '',
                        'is_first_visit': row[13] if len(row) > 13 else ''
                    }
                    appointments.append(appointment)
                except Exception as e:
                    print(f"Error parsing row: {e}")
                    continue
            
            return appointments
        except Exception as e:
            print(f"Error getting appointments from Google Sheets: {e}")
            return []
    
    async def get_upcoming_appointments(self) -> List[Dict]:
        """Get upcoming appointments (within next 7 days)"""
        all_appointments = await self.get_all_appointments()
        
        now = datetime.now()
        upcoming = []
        
        for apt in all_appointments:
            try:
                # Parse fecha (assuming format YYYY-MM-DD or DD/MM/YYYY)
                fecha_str = apt.get('fecha', '')
                if not fecha_str:
                    continue
                
                # Try different date formats
                apt_date = None
                for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y']:
                    try:
                        apt_date = datetime.strptime(fecha_str, fmt)
                        break
                    except:
                        continue
                
                if apt_date and apt_date >= now and (apt_date - now).days <= 7:
                    upcoming.append(apt)
            except Exception as e:
                print(f"Error parsing appointment date: {e}")
                continue
        
        return upcoming
