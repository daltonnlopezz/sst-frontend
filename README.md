# SST 2.0 Frontend

A modern web interface for the SAM Opportunity Search Service (SST) 2.0, providing an intuitive dashboard for opportunity tracking, email processing, and analytics.

## Features

### 🏠 Dashboard
- **Real-time Statistics**: Total opportunities, active opportunities, recent additions
- **Visual Analytics**: Agency distribution charts, NAICS code analysis
- **Recent Opportunities**: Quick view of latest opportunities with key details
- **Email Queue Status**: Monitor email processing queue in real-time

### 📋 Opportunity Management
- **Search & Filter**: Find opportunities by title, agency, NAICS code, status
- **Detailed Views**: Comprehensive opportunity information with all SAM.gov data
- **Quick Actions**: Evaluate, get deliverables, extract proposal requirements
- **Pagination**: Efficient browsing through large datasets

### 📧 Email Integration
- **Send Requests**: Submit Notice IDs for email processing
- **Queue Monitoring**: Track processing status and results
- **Request Types**: Support for evaluate, deliverables, and proposal requests
- **Real-time Updates**: Live status updates and notifications

### 📊 Analytics & Reporting
- **Agency Distribution**: Visual breakdown of opportunities by agency
- **NAICS Analysis**: Top NAICS codes and industry trends
- **Timeline Analysis**: Posted dates and response deadlines
- **Status Tracking**: Active vs inactive opportunity monitoring

## Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5.3
- **Charts**: Chart.js
- **Icons**: Font Awesome 6.4
- **Database**: SQLite (via existing SST.2.0 database)

## Installation

### Prerequisites
- Python 3.7+
- SST.2.0 backend system running
- Database populated with opportunities

### Setup

1. **Navigate to frontend directory**:
   ```bash
   cd SST.2.0/frontend
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Ensure SST.2.0 backend is running**:
   ```bash
   # In SST.2.0 directory
   python main.py
   ```

4. **Start the frontend**:
   ```bash
   python run_frontend.py
   ```

5. **Access the web interface**:
   Open your browser and go to `http://localhost:5000`

## Usage

### Dashboard
- View system statistics and recent opportunities
- Monitor email queue status
- Access quick actions and navigation

### Opportunity Search
1. Use the search bar to find opportunities by title or description
2. Apply filters for agency, NAICS code, or status
3. Click on any opportunity to view detailed information
4. Use action buttons to evaluate, get deliverables, or extract requirements

### Email Processing
1. Click "Send Email Request" on the dashboard
2. Enter your email address and select request type
3. Add Notice IDs (one per line)
4. Submit the request to add items to the processing queue
5. Monitor queue status in real-time

### Analytics
- View agency distribution charts
- Analyze NAICS code trends
- Track opportunity timelines
- Monitor system performance

## API Endpoints

The frontend communicates with the backend through these REST API endpoints:

### Opportunities
- `GET /api/opportunities` - List opportunities with pagination and filtering
- `GET /api/opportunities/<notice_id>` - Get specific opportunity details
- `POST /api/opportunities/<notice_id>/evaluate` - Evaluate opportunity
- `POST /api/opportunities/<notice_id>/deliverables` - Get deliverables
- `POST /api/opportunities/<notice_id>/proposal` - Get proposal requirements

### Email Processing
- `GET /api/email/queue` - Get email queue status
- `GET /api/email/queue/items` - Get email queue items
- `POST /api/email/send` - Send email request

### Statistics
- `GET /api/stats` - Get system statistics

## Configuration

### Email Settings
Configure email processing in the main SST.2.0 system:
```json
{
  "imap_server": "imap.gmail.com",
  "imap_port": 993,
  "smtp_server": "smtp.gmail.com",
  "smtp_port": 587,
  "email_address": "your_email@gmail.com",
  "password": "your_app_password"
}
```

### Database
The frontend uses the existing SST.2.0 database. Ensure the opportunities database is populated and accessible.

## Customization

### Styling
- Modify `static/css/style.css` for custom styling
- Uses CSS custom properties for easy theme customization
- Responsive design for mobile and tablet support

### JavaScript
- Extend `static/js/app.js` for additional functionality
- Modular design allows easy feature additions
- Uses modern ES6+ JavaScript features

### Templates
- Customize HTML templates in the `templates/` directory
- Uses Jinja2 templating engine
- Extensible base template system

## Development

### Running in Development Mode
```bash
python run_frontend.py
```

### Running in Production
```bash
# Using Gunicorn (recommended)
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Using Waitress (Windows)
waitress-serve --host=0.0.0.0 --port=5000 app:app
```

### Debugging
- Set `FLASK_DEBUG=1` for debug mode
- Check browser console for JavaScript errors
- Monitor Flask logs for backend issues

## Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+

## Security Considerations

- **CORS**: Configured for local development
- **Input Validation**: All user inputs are validated
- **XSS Protection**: Output is properly escaped
- **CSRF**: Consider adding CSRF protection for production

## Performance

- **Pagination**: Large datasets are paginated for performance
- **Lazy Loading**: Charts and data load on demand
- **Caching**: Consider adding Redis for production caching
- **CDN**: Static assets can be served from CDN

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure SST.2.0 backend is running
   - Check database file permissions
   - Verify database path in configuration

2. **Email Processing Not Working**
   - Check email configuration
   - Verify IMAP/SMTP credentials
   - Check firewall settings

3. **Charts Not Loading**
   - Check browser console for JavaScript errors
   - Ensure Chart.js is loaded
   - Verify data format

4. **Styling Issues**
   - Clear browser cache
   - Check CSS file loading
   - Verify Bootstrap CDN access

### Debug Mode
Enable debug mode for detailed error messages:
```python
app.config['DEBUG'] = True
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the SST 2.0 system. See the main project license for details.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the main SST.2.0 documentation
3. Check the browser console for errors
4. Contact the development team

## Future Enhancements

- **Real-time Updates**: WebSocket integration for live updates
- **Advanced Filtering**: More sophisticated search and filter options
- **Export Features**: PDF and Excel export capabilities
- **User Management**: Multi-user support with roles and permissions
- **Mobile App**: Native mobile application
- **API Documentation**: Interactive API documentation
- **Testing**: Comprehensive test suite
- **Monitoring**: Application performance monitoring



