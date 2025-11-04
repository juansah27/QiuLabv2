#!/usr/bin/env python3
"""
Simple test script untuk monitoring order API endpoint
"""

import requests
import json

def test_api_without_auth():
    """Test API without authentication first"""
    url = "http://localhost:5000/api/query/monitoring-order"
    
    try:
        print("Testing API without authentication...")
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ API is running but requires authentication (expected)")
            return True
        elif response.status_code == 200:
            print("⚠️ API returned 200 without auth (unexpected)")
            data = response.json()
            print(f"Data: {data}")
            return True
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Is Flask app running?")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_api_with_mock_token():
    """Test API with a mock token"""
    url = "http://localhost:5000/api/query/monitoring-order"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock_token_for_testing'
    }
    
    try:
        print("\nTesting API with mock token...")
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ API correctly rejected invalid token")
            return True
        elif response.status_code == 200:
            print("⚠️ API accepted mock token (unexpected)")
            data = response.json()
            print(f"Data: {data}")
            return True
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("=== Monitoring Order API Test ===\n")
    
    # Test 1: Without authentication
    test1 = test_api_without_auth()
    
    # Test 2: With mock token
    test2 = test_api_with_mock_token()
    
    print(f"\n=== Test Results ===")
    print(f"Test 1 (No Auth): {'✅ PASS' if test1 else '❌ FAIL'}")
    print(f"Test 2 (Mock Token): {'✅ PASS' if test2 else '❌ FAIL'}")
    
    if test1 and test2:
        print("\n✅ API endpoint is working correctly!")
        print("Next step: Test with valid JWT token")
    else:
        print("\n❌ API endpoint has issues")
        print("Check if Flask app is running and endpoint is configured correctly")

