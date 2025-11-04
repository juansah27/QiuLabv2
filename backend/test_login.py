import requests
import json

def test_login():
    """
    Test login functionality with direct API call
    """
    # URL endpoint
    url = "http://192.168.1.14:5000/api/auth/login"
    
    # Login credentials
    credentials = {
        "username": "ladyqiu",
        "password": "@Wanipiro27"
    }
    
    # Headers
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        # Make POST request
        print(f"Sending POST request to {url}")
        response = requests.post(url, data=json.dumps(credentials), headers=headers)
        
        # Print response details
        print(f"Status code: {response.status_code}")
        print(f"Response headers: {response.headers}")
        
        # Try to parse JSON response
        try:
            print(f"Response body: {response.json()}")
        except ValueError:
            print(f"Response body (not JSON): {response.text}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"Error during test: {str(e)}")
        return False

if __name__ == "__main__":
    result = test_login()
    print(f"Login test {'PASSED' if result else 'FAILED'}") 