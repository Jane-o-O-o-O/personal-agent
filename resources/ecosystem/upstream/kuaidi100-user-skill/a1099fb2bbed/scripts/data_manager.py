#!/usr/bin/env python3
"""
数据管理器 - 管理用户寄件数据（无Key模式核心组件）

数据目录: ~/.openclaw/kuaidi100-user/data/

核心设计原则：
1. 无Key模式下优先使用本地数据，减少用户询问
2. 数据持久化保存，支持跨会话使用
3. 自动去重和过期清理，保持数据整洁
4. 用户新信息及时更新，保证数据准确性
"""

import json
import os
import time
from pathlib import Path
from typing import Optional, List, Dict


# ==================== 配置 ====================

MAX_RECEIVERS = 10          # 最多保存收件人数量
MAX_ORDERS = 50             # 最多保存订单数量
RECEIVER_EXPIRY_DAYS = 90   # 收件人数据有效期（天）
ORDER_EXPIRY_DAYS = 365     # 订单数据有效期（天）


def _get_data_dir() -> Path:
    """获取数据目录"""
    openclaw_dir = Path.home() / ".openclaw" / "kuaidi100-user" / "data"
    if os.access(Path.home(), os.W_OK):
        return openclaw_dir
    return Path(__file__).parent.parent / "data"


DATA_DIR = _get_data_dir()


def ensure_data_dir():
    """确保数据目录存在"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)


# ==================== 寄件人管理 ====================

def save_default_sender(sender_info: dict) -> bool:
    """保存默认寄件人"""
    if not sender_info or not sender_info.get("name"):
        return False
    
    ensure_data_dir()
    data = {
        "info": sender_info,
        "updated_at": int(time.time())
    }
    
    try:
        with open(DATA_DIR / "default_sender.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"[DataManager] 保存寄件人失败: {e}")
        return False


def load_default_sender() -> Optional[dict]:
    """加载默认寄件人"""
    file_path = DATA_DIR / "default_sender.json"
    if not file_path.exists():
        return None
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("info")
    except Exception as e:
        print(f"[DataManager] 加载寄件人失败: {e}")
        return None


def has_default_sender() -> bool:
    """检查是否存在默认寄件人"""
    return load_default_sender() is not None


# ==================== 收件人管理 ====================

def save_receiver(receiver_info: dict) -> bool:
    """保存收件人到历史记录"""
    if not receiver_info or not receiver_info.get("name"):
        return False
    
    ensure_data_dir()
    receivers = load_recent_receivers()
    
    # 添加时间戳
    receiver_info["_saved_at"] = int(time.time())
    
    # 去重：如果已存在同名+同手机收件人，先删除旧的
    receivers = [r for r in receivers 
                 if not (r.get("name") == receiver_info.get("name") and 
                        r.get("phone") == receiver_info.get("phone"))]
    
    # 添加到开头（最新的在前面）
    receivers.insert(0, receiver_info)
    
    # 只保留指定数量
    receivers = receivers[:MAX_RECEIVERS]
    
    try:
        with open(DATA_DIR / "recent_receivers.json", "w", encoding="utf-8") as f:
            json.dump(receivers, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"[DataManager] 保存收件人失败: {e}")
        return False


def load_recent_receivers() -> List[dict]:
    """加载最近收件人列表（自动清理过期数据）"""
    file_path = DATA_DIR / "recent_receivers.json"
    if not file_path.exists():
        return []
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            receivers = json.load(f)
        
        # 过滤过期数据
        now = int(time.time())
        expiry_seconds = RECEIVER_EXPIRY_DAYS * 24 * 3600
        valid_receivers = [
            r for r in receivers 
            if now - r.get("_saved_at", 0) < expiry_seconds
        ]
        
        # 如果有过期数据被清理，重新保存
        if len(valid_receivers) < len(receivers):
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(valid_receivers, f, ensure_ascii=False, indent=2)
        
        return valid_receivers
    except Exception as e:
        print(f"[DataManager] 加载收件人失败: {e}")
        return []


def find_receiver_by_name(name: str) -> List[dict]:
    """根据姓名查找收件人（模糊匹配）"""
    if not name:
        return []
    
    receivers = load_recent_receivers()
    name_lower = name.lower()
    
    matches = []
    for r in receivers:
        receiver_name = r.get("name", "")
        if name_lower in receiver_name.lower() or receiver_name.lower() in name_lower:
            matches.append(r)
    
    return matches


def find_receiver_by_phone(phone: str) -> Optional[dict]:
    """根据手机号精确查找收件人"""
    if not phone:
        return None
    
    receivers = load_recent_receivers()
    for r in receivers:
        if r.get("phone") == phone:
            return r
    return None


def get_receiver_names() -> List[str]:
    """获取所有收件人姓名列表（用于展示）"""
    receivers = load_recent_receivers()
    return [r.get("name") for r in receivers if r.get("name")]


def has_receivers() -> bool:
    """检查是否存在收件人记录"""
    return len(load_recent_receivers()) > 0


# ==================== 订单管理 ====================

def save_order(order_info: dict) -> bool:
    """保存订单到本地历史记录"""
    if not order_info or not order_info.get("orderNo"):
        return False
    
    ensure_data_dir()
    orders = load_recent_orders()
    
    # 添加时间戳
    order_info["_saved_at"] = int(time.time())
    
    # 去重：同一订单号只保留最新
    orders = [o for o in orders if o.get("orderNo") != order_info.get("orderNo")]
    
    # 添加到开头
    orders.insert(0, order_info)
    
    # 只保留指定数量
    orders = orders[:MAX_ORDERS]
    
    try:
        with open(DATA_DIR / "recent_orders.json", "w", encoding="utf-8") as f:
            json.dump(orders, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"[DataManager] 保存订单失败: {e}")
        return False


def load_recent_orders() -> List[dict]:
    """加载最近订单列表（自动清理过期数据）"""
    file_path = DATA_DIR / "recent_orders.json"
    if not file_path.exists():
        return []
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            orders = json.load(f)
        
        # 过滤过期数据
        now = int(time.time())
        expiry_seconds = ORDER_EXPIRY_DAYS * 24 * 3600
        valid_orders = [
            o for o in orders 
            if now - o.get("_saved_at", 0) < expiry_seconds
        ]
        
        # 如果有过期数据被清理，重新保存
        if len(valid_orders) < len(orders):
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(valid_orders, f, ensure_ascii=False, indent=2)
        
        return valid_orders
    except Exception as e:
        print(f"[DataManager] 加载订单失败: {e}")
        return []


def find_order_by_no(order_no: str) -> Optional[dict]:
    """根据订单号查找订单"""
    for order in load_recent_orders():
        if order.get("orderNo") == order_no:
            return order
    return None


def find_orders_by_receiver(receiver_name: str) -> List[dict]:
    """根据收件人姓名查找相关订单"""
    if not receiver_name:
        return []
    
    orders = load_recent_orders()
    matches = []
    for o in orders:
        if o.get("receiverName") == receiver_name:
            matches.append(o)
    return matches


def get_recent_order_nos(limit: int = 5) -> List[str]:
    """获取最近订单号列表"""
    orders = load_recent_orders()
    return [o.get("orderNo") for o in orders[:limit] if o.get("orderNo")]


# ==================== 统计数据 ====================

def get_stats() -> dict:
    """获取本地数据统计信息"""
    return {
        "has_sender": has_default_sender(),
        "receiver_count": len(load_recent_receivers()),
        "order_count": len(load_recent_orders()),
        "receiver_names": get_receiver_names()[:5],  # 只显示前5个
        "recent_orders": get_recent_order_nos(5)
    }


# ==================== 清理功能 ====================

def clear_all_data():
    """清空所有本地数据（谨慎使用）"""
    files = ["default_sender.json", "recent_receivers.json", "recent_orders.json"]
    for filename in files:
        file_path = DATA_DIR / filename
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception as e:
                print(f"[DataManager] 删除 {filename} 失败: {e}")


def clear_expired_data():
    """清理所有过期数据"""
    # 收件人数据会自动在加载时清理
    load_recent_receivers()
    # 订单数据会自动在加载时清理
    load_recent_orders()


if __name__ == "__main__":
    print("=" * 50)
    print("数据管理器测试")
    print("=" * 50)
    print(f"\n数据目录: {DATA_DIR}")
    print(f"\n统计信息:")
    stats = get_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")
