@echo off
REM PropertyPulse Landlord Functionality Test Script - Windows Version

echo === Testing Landlord Functionality ===

REM Step 1: Register landlord user
echo 1. Registering landlord user...
curl -s -X POST "http://localhost:5000/api/auth/register" -H "Content-Type: application/json" -d "{\"email\":\"landlord.verify@example.com\",\"firstName\":\"Landlord\",\"lastName\":\"Test\",\"role\":\"landlord\"}" > landlord_response.json

echo Registration Response:
type landlord_response.json

REM Extract custom token (Windows doesn't have jq, so we'll do this manually)
echo.
echo Please manually extract the customToken from the response above and run:
echo node exchange-token.js "YOUR_CUSTOM_TOKEN_HERE"
echo.
echo Then copy the ID token and continue with manual testing below:

echo === Manual Testing Commands for Windows ===
echo.
echo Step 2: Test Property Management
echo curl -H "Authorization: Bearer YOUR_ID_TOKEN" "http://localhost:5000/api/properties"
echo.
echo Step 3: Test Property Creation
echo curl -X POST "http://localhost:5000/api/properties" -H "Authorization: Bearer YOUR_ID_TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Test Property\",\"description\":\"Test property for verification\",\"propertyType\":\"APARTMENT\",\"addressStreet\":\"123 Test St\",\"addressCity\":\"Atlanta\",\"addressState\":\"GA\",\"addressZip\":\"30309\",\"bedrooms\":2,\"bathrooms\":1,\"rentAmount\":1800}"
echo.
echo Step 4: Test Lease Management
echo curl -H "Authorization: Bearer YOUR_ID_TOKEN" "http://localhost:5000/api/leases"
echo.
echo Step 5: Test Payment Management
echo curl -H "Authorization: Bearer YOUR_ID_TOKEN" "http://localhost:5000/api/payments"
echo.
echo Step 6: Test Maintenance Management
echo curl -H "Authorization: Bearer YOUR_ID_TOKEN" "http://localhost:5000/api/maintenance"
echo.
echo Step 7: Test Application Management
echo curl -H "Authorization: Bearer YOUR_ID_TOKEN" "http://localhost:5000/api/rental-applications"

echo.
echo === Expected Results ===
echo - Property Management: Should return 200 with property data
echo - Lease Management: Likely 404 (routes don't exist yet)
echo - Payment Management: Likely 404 (routes don't exist yet)
echo - Maintenance Management: Likely 404 (routes don't exist yet)
echo - Application Management: Should return 200 (already working)

pause