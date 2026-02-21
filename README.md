# Cafe Management System

A comprehensive full-stack web application for managing cafe operations, including user registration, staff management, menu handling, and administrative control.

## 🚀 Features

### Core Functionality
- **Multi-Role Authentication**: Admin, Cafe Owner, Chef, Waiter, and Customer roles
- **User Registration & Management**: Complete registration workflow with document upload
- **Cafe Management**: Owners can create and manage their cafe profiles
- **Staff Management**: Hire and manage staff with automatic credential delivery
- **Menu Management**: Dynamic menu creation, editing, and availability toggling
- **Function Booking**: Dine-in, birthday, and corporate event capacity management
- **Image Management**: Upload and manage cafe images with cover image support
- **Document Management**: Staff document upload and storage

### Administrative Features
- **User Management**: Admin can view, approve, and delete users
- **Cafe Owner Management**: Create and manage cafe owners with academic/work experience
- **Cafe Management**: View and manage all registered cafes
- **Document Review**: Review uploaded documents with approval/rejection workflow

### Email Notifications
- **Credential Delivery**: Automatic email delivery of login credentials to staff
- **Approval Notifications**: Email notifications for registration decisions

## 🛠 Technology Stack

### Backend (Spring Boot)
- **Java 17** with Spring Boot 4.0.2
- **Spring Security** for authentication and authorization
- **Spring Data JPA** for database operations
- **MySQL** as the database
- **Spring Mail** for email notifications
- **Lombok** for reducing boilerplate code
- **ModelMapper** for object mapping
- **Maven** for dependency management

### Frontend (React)
- **React 18** with modern hooks
- **React Router** for navigation
- **Axios** for API communication
- **Tailwind CSS** for styling
- **Vite** as the build tool

### Database Schema
- **Users Table**: Core user information with role-based access
- **Cafes Table**: Cafe profiles and details
- **Menu Items Table**: Dynamic menu management
- **Function Capacities Table**: Event booking capacities
- **Cafe Images Table**: Image storage and management
- **Documents Table**: Staff document storage
- **Personal Details & Address Tables**: Extended user information
- **Academic & Work Experience Tables**: Professional background tracking

## 📁 Project Structure

```
cafe-app/
├── src/main/java/com/cafe/
│   ├── controller/          # REST API endpoints
│   │   ├── AdminController.java
│   │   ├── OwnerController.java
│   │   ├── AuthController.java
│   │   └── PublicCafeImageController.java
│   ├── service/            # Business logic layer
│   │   ├── impl/           # Service implementations
│   │   └── interfaces/     # Service interfaces
│   ├── entity/             # JPA entities
│   ├── dto/                # Data Transfer Objects
│   ├── repository/         # JPA repositories
│   └── config/             # Configuration classes
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   │   ├── dashboards/ # Role-specific dashboards
│   │   │   └── auth/       # Authentication pages
│   │   ├── lib/            # API utilities
│   │   └── styles/         # CSS and styling
│   └── package.json
├── uploads/                 # File storage directory
└── pom.xml                # Maven configuration
```

## 🚀 Getting Started

### Prerequisites
- **Java 17** or higher
- **Node.js 16+** and npm
- **MySQL 8.0** or higher
- **Maven 3.6+**

### Database Setup
1. Create a MySQL database:
```sql
CREATE DATABASE cafe_app;
```

2. Configure database connection in `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/cafe_app
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

### Email Configuration (Optional)
Configure email settings in `application.properties`:
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### Running the Application

1. **Backend Setup**:
```bash
# Navigate to project root
cd cafe-app

# Install dependencies and run backend
./mvnw spring-boot:run
```

2. **Frontend Setup**:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

3. **Access the Application**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

## 🔐 Authentication & Authorization

### User Roles
- **ADMIN**: Full system access, user management, cafe oversight
- **OWNER**: Cafe management, staff hiring, menu control
- **CHEF**: Menu access, order management
- **WAITER**: Order management, customer service
- **CUSTOMER**: Browsing and ordering

### Security Features
- JWT-based authentication
- Role-based access control
- Password encryption with BCrypt
- Session management
- API endpoint protection

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Password change

### Admin Endpoints
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/owners` - List cafe owners
- `POST /api/admin/owners` - Create cafe owner
- `GET /api/admin/cafes` - List cafes
- `POST /api/admin/cafes` - Create cafe
- `DELETE /api/admin/cafes/{id}` - Delete cafe

### Owner Endpoints
- `GET /api/owner/cafe` - Get cafe profile
- `PUT /api/owner/cafe` - Update cafe profile
- `DELETE /api/owner/cafe` - Delete cafe
- `GET /api/owner/staff` - List staff
- `POST /api/owner/staff` - Create staff
- `DELETE /api/owner/staff/{id}` - Delete staff
- `GET /api/owner/menu` - List menu items
- `POST /api/owner/menu` - Create menu item
- `PUT /api/owner/menu/{id}` - Update menu item
- `DELETE /api/owner/menu/{id}` - Delete menu item

## 🎨 UI Components

### Dashboards
- **Admin Dashboard**: User management, cafe oversight, document review
- **Owner Dashboard**: Cafe profile, staff management, menu control
- **Chef/Waiter Dashboard**: Order management, kitchen operations
- **Customer Interface**: Menu browsing, ordering system

### Key Features
- Responsive design with Tailwind CSS
- Real-time form validation
- File upload capabilities
- Modal-based interactions
- Loading states and error handling

## 🧪 Testing

### Running Tests
```bash
# Backend tests
./mvnw test

# Frontend tests (if configured)
cd frontend
npm test
```

## 📝 Configuration

### Application Properties
Key configuration options in `src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/cafe_app
spring.datasource.username=root
spring.datasource.password=password

# File Upload
cafe.images.dir=uploads/cafe-images

# Email
spring.mail.host=smtp.gmail.com
spring.mail.port=587

# Development Admin
dev.admin.key=your-secret-key
```

## 🚀 Deployment

### Production Build
1. **Backend**:
```bash
./mvnw clean package
java -jar target/cafe-app-0.0.1-SNAPSHOT.jar
```

2. **Frontend**:
```bash
cd frontend
npm run build
```

### Docker Deployment (Optional)
Create a `Dockerfile` for containerized deployment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the existing issues
2. Create a new issue with detailed description
3. Include steps to reproduce any bugs

## 🔄 Version History

- **v0.0.1-SNAPSHOT**: Initial release with core functionality
  - User authentication and authorization
  - Cafe management system
  - Staff management with email notifications
  - Menu and capacity management
  - Document upload system
  - Admin dashboard with user management

## 🔮 Future Enhancements

- Order processing system
- Payment integration
- Advanced analytics dashboard
- Mobile application
- Multi-language support
- Advanced booking system
- Inventory management
- Customer loyalty program
