import requests

BASE_URL = "http://localhost:8000/api/v1"

def run_tests():
    print("=== Integration Test for Checkpoint 2 ===")
    
    # 1. aliceでログイン
    print("\n1. Logging in as alice...")
    res_alice = requests.post(f"{BASE_URL}/auth/google", json={"credential": "test_alice"})
    assert res_alice.status_code == 200, "Alice login failed"
    tokens_alice = res_alice.json()
    headers_alice = {"Authorization": f"Bearer {tokens_alice['access_token']}"}
    
    # aliceのユーザーIDを取得
    res_me_alice = requests.get(f"{BASE_URL}/users/me", headers=headers_alice)
    alice_id = res_me_alice.json()["id"]
    print(f"Alice user ID: {alice_id}, Email: {res_me_alice.json()['email']}")
    
    # 2. bobでログイン
    print("\n2. Logging in as bob...")
    res_bob = requests.post(f"{BASE_URL}/auth/google", json={"credential": "test_bob"})
    assert res_bob.status_code == 200, "Bob login failed"
    tokens_bob = res_bob.json()
    headers_bob = {"Authorization": f"Bearer {tokens_bob['access_token']}"}
    
    # bobのユーザーIDを取得
    res_me_bob = requests.get(f"{BASE_URL}/users/me", headers=headers_bob)
    bob_id = res_me_bob.json()["id"]
    print(f"Bob user ID: {bob_id}, Email: {res_me_bob.json()['email']}")
    
    # 3. aliceが投稿を作成
    print("\n3. Alice creating a post...")
    post_content = "Hello! Welcome to Zen SNS! - Created by Alice"
    res_post = requests.post(
        f"{BASE_URL}/posts",
        json={"content": post_content, "image_url": None, "parent_id": None},
        headers=headers_alice
    )
    assert res_post.status_code == 200, "Post creation failed"
    post_data = res_post.json()
    post_id = post_data["id"]
    print(f"Post created successfully. ID: {post_id}, Content: '{post_data['content']}'")
    
    # 4. bobが全体タイムラインを取得
    print("\n4. Bob fetching global timeline (should see Alice's post)...")
    res_tl = requests.get(f"{BASE_URL}/timelines/global", headers=headers_bob)
    assert res_tl.status_code == 200, "Timeline fetch failed"
    tl_posts = res_tl.json()
    alice_post_visible = any(p["id"] == post_id for p in tl_posts)
    print(f"Alice's post visible to Bob: {alice_post_visible}")
    assert alice_post_visible, "Alice's post is not visible in Bob's global timeline"
    
    # 5. bobがaliceをブロックする
    print(f"\n5. Bob blocking Alice (User ID: {alice_id})...")
    res_block = requests.post(f"{BASE_URL}/users/{alice_id}/block", headers=headers_bob)
    assert res_block.status_code == 200, "Blocking failed"
    print(f"Block response: {res_block.json()['message']}")
    
    # 6. bobが全体タイムラインを再度取得
    print("\n6. Bob fetching global timeline again (should NOT see Alice's post)...")
    res_tl_after = requests.get(f"{BASE_URL}/timelines/global", headers=headers_bob)
    assert res_tl_after.status_code == 200, "Timeline fetch after block failed"
    tl_posts_after = res_tl_after.json()
    alice_post_visible_after = any(p["id"] == post_id for p in tl_posts_after)
    print(f"Alice's post visible to Bob after block: {alice_post_visible_after}")
    assert not alice_post_visible_after, "Alice's post is still visible in Bob's timeline after block"
    
    # 7. bobがaliceをアンブロック（後片付け）
    print(f"\n7. Bob unblocking Alice (User ID: {alice_id}) for cleanup...")
    res_unblock = requests.delete(f"{BASE_URL}/users/{alice_id}/block", headers=headers_bob)
    assert res_unblock.status_code == 200, "Unblocking failed"
    print(f"Unblock response: {res_unblock.json()['message']}")
    
    # 8. aliceが自分の投稿を削除（後片付け）
    print(f"\n8. Alice deleting her post (ID: {post_id}) for cleanup...")
    res_del = requests.delete(f"{BASE_URL}/posts/{post_id}", headers=headers_alice)
    assert res_del.status_code == 200, "Post deletion failed"
    print(f"Delete response: {res_del.json()['message']}")
    
    print("\n=== All Tests Passed Successfully! ===")

if __name__ == "__main__":
    run_tests()
