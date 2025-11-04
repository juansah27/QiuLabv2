#!/usr/bin/env python3
"""
Test script to verify path detection
Run: python test_path.py
"""

from path_helper import (
    get_shopee_path,
    get_tiktok_path,
    get_lazada_path,
    get_desty_path,
    get_ginee_path,
    get_jubelio_path
)
import os

def test_path(name, path_func):
    print(f"\n{'='*60}")
    print(f"Testing {name}")
    print(f"{'='*60}")
    
    path = path_func()
    print(f"Resolved Path: {path}")
    
    exists = os.path.exists(path)
    status = "[OK] EXISTS" if exists else "[X] NOT FOUND"
    print(f"Status: {status}")
    
    if exists:
        print(f"Contents preview:")
        try:
            items = os.listdir(path)[:5]  # First 5 items
            for item in items:
                item_type = "[DIR]" if os.path.isdir(os.path.join(path, item)) else "[FILE]"
                print(f"  {item_type} {item}")
        except Exception as e:
            print(f"  Error listing: {e}")
    
    return exists

def main():
    print("\n>>> Path Detection Test")
    print("=" * 60)
    
    marketplaces = [
        ("SHOPEE", get_shopee_path),
        ("TIKTOK", get_tiktok_path),
        ("LAZADA", get_lazada_path),
        ("DESTY", get_desty_path),
        ("GINEE", get_ginee_path),
        ("JUBELIO", get_jubelio_path)
    ]
    
    results = {}
    for name, func in marketplaces:
        results[name] = test_path(name, func)
    
    # Summary
    print(f"\n{'='*60}")
    print(">>> SUMMARY")
    print(f"{'='*60}")
    
    for name, exists in results.items():
        status = "[OK]" if exists else "[X]"
        print(f"{status} {name}: {'Ready' if exists else 'Path not found'}")
    
    total = len(results)
    success = sum(results.values())
    print(f"\n{success}/{total} paths detected successfully")
    
    if success < total:
        print("\n>>> Tips:")
        print("1. Check if network share is mounted")
        print("2. Set environment variables for custom paths")
        print("3. See PATH_CONFIG_README.md for details")

if __name__ == "__main__":
    main()

