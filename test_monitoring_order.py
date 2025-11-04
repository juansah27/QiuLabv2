#!/usr/bin/env python3
"""
Test script untuk monitoring order API endpoint
"""

import requests
import json

def test_monitoring_order_api():
    """Test the monitoring order API endpoint"""
    
    # URL API endpoint
    url = "http://localhost:5000/api/query/monitoring-order"
    
    # Headers dengan token (ganti dengan token yang valid)
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE'  # Ganti dengan token yang valid
    }
    
    try:
        print("Testing monitoring order API endpoint...")
        print(f"URL: {url}")
        
        # Make GET request
        response = requests.get(url, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Status: {data.get('status')}")
            print(f"Total Records: {data.get('total')}")
            
            if data.get('data'):
                print(f"First record: {data['data'][0]}")
                print(f"Available fields: {list(data['data'][0].keys())}")
                
                # Check for Brand and MARKETPLACE fields
                brand_count = sum(1 for r in data['data'] if r.get('Brand'))
                marketplace_count = sum(1 for r in data['data'] if r.get('MARKETPLACE'))
                print(f"Records with Brand: {brand_count}")
                print(f"Records with MARKETPLACE: {marketplace_count}")
                
                # Show sample brands and marketplaces
                brands = list(set(r.get('Brand') for r in data['data'] if r.get('Brand')))
                marketplaces = list(set(r.get('MARKETPLACE') for r in data['data'] if r.get('MARKETPLACE')))
                print(f"Sample Brands: {brands[:5]}")
                print(f"Sample Marketplaces: {marketplaces[:5]}")
            else:
                print("No data returned")
        else:
            print(f"Error Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure the Flask app is running.")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_monitoring_order_api()

