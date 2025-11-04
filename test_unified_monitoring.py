#!/usr/bin/env python3
"""
Test script for unified monitoring endpoint
Validates data consistency between cards and charts
"""

import requests
import json
from datetime import datetime, timedelta
import sys

# Configuration
API_BASE_URL = "http://localhost:5000"  # Adjust as needed
TEST_SYSTEM_REF_IDS = [
    "ORDER001", "ORDER002", "ORDER003", "ORDER004", "ORDER005",
    "ORDER006", "ORDER007", "ORDER008", "ORDER009", "ORDER010"
]

def test_unified_monitoring_endpoint():
    """Test the unified monitoring endpoint with various filter combinations"""
    
    print("🧪 Testing Unified Monitoring Endpoint")
    print("=" * 50)
    
    # Test cases
    test_cases = [
        {
            "name": "Basic test without filters",
            "data": {
                "system_ref_ids": TEST_SYSTEM_REF_IDS,
                "filters": {}
            }
        },
        {
            "name": "Test with date range filter",
            "data": {
                "system_ref_ids": TEST_SYSTEM_REF_IDS,
                "filters": {
                    "dateRange": {
                        "start_date": (datetime.now() - timedelta(days=7)).isoformat(),
                        "end_date": datetime.now().isoformat()
                    }
                }
            }
        },
        {
            "name": "Test with brand filter",
            "data": {
                "system_ref_ids": TEST_SYSTEM_REF_IDS,
                "filters": {
                    "brand": "AMAN MAJU NUSANTARA"
                }
            }
        },
        {
            "name": "Test with marketplace filter",
            "data": {
                "system_ref_ids": TEST_SYSTEM_REF_IDS,
                "filters": {
                    "marketplace": "SHOPEE"
                }
            }
        },
        {
            "name": "Test with status exclusion",
            "data": {
                "system_ref_ids": TEST_SYSTEM_REF_IDS,
                "filters": {
                    "status": ["cancelled", "unpaid"]
                }
            }
        },
        {
            "name": "Test with combined filters",
            "data": {
                "system_ref_ids": TEST_SYSTEM_REF_IDS,
                "filters": {
                    "dateRange": {
                        "start_date": (datetime.now() - timedelta(days=30)).isoformat(),
                        "end_date": datetime.now().isoformat()
                    },
                    "brand": "AMAN MAJU NUSANTARA",
                    "marketplace": "SHOPEE",
                    "status": ["cancelled", "unpaid", "pending_payment"]
                }
            }
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📋 Test {i}: {test_case['name']}")
        print("-" * 40)
        
        try:
            # Make API request with authentication
            response = requests.get(
                f"{API_BASE_URL}/api/query/order-monitoring",
                params=test_case["params"],
                headers={
                    "Authorization": f"Bearer {token}"
                },
                timeout=120  # Increase timeout to 2 minutes
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("status") == "success":
                    result = validate_data_consistency(data["data"])
                    results.append({
                        "test": test_case["name"],
                        "status": "PASS" if result["is_valid"] else "FAIL",
                        "warnings": result["warnings"],
                        "data_summary": get_data_summary(data["data"])
                    })
                    
                    print(f"✅ Status: PASS")
                    print(f"📊 Data Summary: {get_data_summary(data['data'])}")
                    
                    if result["warnings"]:
                        print(f"⚠️  Warnings: {', '.join(result['warnings'])}")
                else:
                    results.append({
                        "test": test_case["name"],
                        "status": "FAIL",
                        "error": "API returned error status"
                    })
                    print(f"❌ Status: FAIL - API returned error status")
            else:
                results.append({
                    "test": test_case["name"],
                    "status": "FAIL",
                    "error": f"HTTP {response.status_code}: {response.text}"
                })
                print(f"❌ Status: FAIL - HTTP {response.status_code}")
                print(f"Error: {response.text}")
                
        except requests.exceptions.RequestException as e:
            results.append({
                "test": test_case["name"],
                "status": "FAIL",
                "error": f"Request failed: {str(e)}"
            })
            print(f"❌ Status: FAIL - Request failed: {str(e)}")
        except Exception as e:
            results.append({
                "test": test_case["name"],
                "status": "FAIL",
                "error": f"Unexpected error: {str(e)}"
            })
            print(f"❌ Status: FAIL - Unexpected error: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 50)
    print("📋 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📊 Total: {len(results)}")
    
    if failed > 0:
        print("\n❌ Failed Tests:")
        for result in results:
            if result["status"] == "FAIL":
                print(f"  - {result['test']}: {result.get('error', 'Unknown error')}")
    
    return passed == len(results)

def validate_data_consistency(data):
    """Validate data consistency between cards and charts"""
    warnings = []
    
    try:
        # Get total orders from cards
        total_orders = data.get("cards", {}).get("total_orders", 0)
        
        # Validate top brands sum
        top_brands = data.get("charts", {}).get("top_brands", [])
        top_brands_sum = sum(item.get("value", 0) for item in top_brands)
        
        if total_orders != top_brands_sum:
            warnings.append(f"Top brands sum ({top_brands_sum}) doesn't match total orders ({total_orders})")
        
        # Validate platform distribution sum
        platform_distribution = data.get("charts", {}).get("platform_distribution", [])
        platform_sum = sum(item.get("value", 0) for item in platform_distribution)
        
        if total_orders != platform_sum:
            warnings.append(f"Platform distribution sum ({platform_sum}) doesn't match total orders ({total_orders})")
        
        # Validate order evolution sum
        order_evolution = data.get("charts", {}).get("order_evolution", [])
        evolution_sum = sum(item.get("value", 0) for item in order_evolution)
        
        if total_orders != evolution_sum:
            warnings.append(f"Order evolution sum ({evolution_sum}) doesn't match total orders ({total_orders})")
        
        # Validate card metrics consistency
        cards = data.get("cards", {})
        interfaced = cards.get("interfaced", 0)
        not_interfaced = cards.get("not_interfaced", 0)
        pending_verification = cards.get("pending_verification", 0)
        
        calculated_total = interfaced + not_interfaced + pending_verification
        if total_orders != calculated_total:
            warnings.append(f"Card metrics sum ({calculated_total}) doesn't match total orders ({total_orders})")
        
        # Validate data timestamp
        data_timestamp = data.get("data_timestamp")
        if not data_timestamp:
            warnings.append("Missing data timestamp")
        
        # Validate filters applied
        filters_applied = data.get("filters_applied")
        if not filters_applied:
            warnings.append("Missing filters applied information")
        
        return {
            "is_valid": len(warnings) == 0,
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "is_valid": False,
            "warnings": [f"Validation error: {str(e)}"]
        }

def get_data_summary(data):
    """Get a summary of the data for display"""
    try:
        cards = data.get("cards", {})
        charts = data.get("charts", {})
        
        summary = {
            "total_orders": cards.get("total_orders", 0),
            "interfaced": cards.get("interfaced", 0),
            "not_interfaced": cards.get("not_interfaced", 0),
            "pending_verification": cards.get("pending_verification", 0),
            "top_brands_count": len(charts.get("top_brands", [])),
            "platforms_count": len(charts.get("platform_distribution", [])),
            "evolution_points": len(charts.get("order_evolution", [])),
            "table_records": len(data.get("results", []))
        }
        
        return summary
        
    except Exception as e:
        return {"error": f"Summary error: {str(e)}"}

def main():
    """Main function"""
    print("🚀 Unified Monitoring Endpoint Test Suite")
    print("=" * 60)
    
    # Check if API is accessible
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        print(f"✅ API is accessible at {API_BASE_URL}")
    except:
        print(f"⚠️  Warning: API may not be accessible at {API_BASE_URL}")
        print("   Make sure the backend server is running")
    
    # Run tests
    success = test_unified_monitoring_endpoint()
    
    if success:
        print("\n🎉 All tests passed! Unified monitoring is working correctly.")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed. Please check the implementation.")
        sys.exit(1)

if __name__ == "__main__":
    main()
