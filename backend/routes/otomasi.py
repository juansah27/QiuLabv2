from __future__ import annotations

import html
import json
import os
import re
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import importlib.util
import subprocess
import sys

from flask import Blueprint, Response, request


otomasi_bp = Blueprint("otomasi_bp", __name__)


# Directory where the automation scripts live
SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "otomasi"
SCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

SCRIPTS = {
    "Desty": "Get_Otomasi_Desty.py",
    "Ginee": "Get_Otomasi_Ginee.py",
    "Lazada": "Get_Otomasi_Lazada.py",
    "Shopee": "Get_Otomasi_Shopee.py",
    "Tiktok": "Get_Otomasi_Tiktok.py",
    "Jubelio": "Get_Otomasi_Jubelio.py",
}


def _detect_scripts_from_input(input_text: str):
    if not input_text:
        return [], "Input kosong"

    lines = input_text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    flags = {
        "Tiktok": False,
        "Desty": False,
        "Lazada": False,
        "Shopee": False,
        "Ginee": False,
        "Jubelio": False,
    }

    valid_lines = 0
    for line in lines:
        if not line.strip():
            continue
        parts = None
        if "\t" in line:
            left, right = line.split("\t", 1)
            parts = [left, right]
        else:
            m = re.match(r"(.+?)\s+(\S+)$", line.strip())
            if m:
                parts = [m.group(1), m.group(2)]
        if not parts or len(parts) < 2:
            continue
        valid_lines += 1
        order_token = (
            parts[1]
            .strip()
            .strip('"')
            .strip("'")
            .replace("\u200b", "")
            .upper()
        )
        if order_token.startswith("TTS") or order_token.startswith("579"):
            flags["Tiktok"] = True
        if (
            order_token.startswith("DST-")
            or order_token.startswith("1954")
            or order_token.startswith("1955")
            or order_token.startswith("1956")
        ):
            flags["Desty"] = True
        if order_token.startswith("LZ-") or order_token.startswith("264") or order_token.startswith("273"):
            flags["Lazada"] = True
        if order_token.startswith("SHOPEE") or order_token.startswith("25"):
            flags["Shopee"] = True
        if order_token.startswith("GN-") or order_token.startswith("GN"):
            flags["Ginee"] = True
        if (
            order_token.startswith("SP-")
            or order_token.startswith("TT-")
            or order_token.startswith("TP-")
            or order_token.startswith("LZ-")
        ):
            flags["Jubelio"] = True

    selected_names = [name for name in SCRIPTS.keys() if flags.get(name, False)]
    info = f"Ditemukan {valid_lines} baris data valid"
    return selected_names, info


# Session storage for executions
_execution_sessions: dict[str, dict] = {}


@otomasi_bp.post("/check")
def check_scripts():
    inline_text = request.form.get("orders_text", "")
    input_file_path = SCRIPTS_DIR / "input_orders.txt"

    if inline_text and inline_text.strip():
        selected_names, info = _detect_scripts_from_input(inline_text)
        input_info = f"{info} dari textarea"
    else:
        if input_file_path.exists():
            try:
                existing_text = input_file_path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                existing_text = input_file_path.read_text(encoding="latin-1")
            selected_names, info = _detect_scripts_from_input(existing_text)
            input_info = f"{info} dari file input_orders.txt yang sudah ada"
        else:
            selected_names, input_info = [], "File input_orders.txt tidak ditemukan"

    return {"selected_names": selected_names, "input_info": input_info}


@otomasi_bp.post("/run_live")
def run_live():
    session_id = str(uuid.uuid4())
    inline_text = request.form.get("orders_text", "")
    input_file_path = SCRIPTS_DIR / "input_orders.txt"

    # Save input if provided
    if inline_text and inline_text.strip():
        try:
            normalized = inline_text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
            while normalized and not normalized[-1].strip():
                normalized.pop()
            final_text = "\r\n".join(normalized) + ("\r\n" if normalized else "")
            tmp_path = input_file_path.with_suffix(".tmp")
            tmp_path.write_text(final_text, encoding="utf-8")
            os.replace(tmp_path, input_file_path)
        except Exception:
            pass

    # Detect selected scripts
    if inline_text and inline_text.strip():
        selected_names, _ = _detect_scripts_from_input(inline_text)
    else:
        if input_file_path.exists():
            try:
                existing_text = input_file_path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                existing_text = input_file_path.read_text(encoding="latin-1")
            selected_names, _ = _detect_scripts_from_input(existing_text)
        else:
            selected_names = []

    # Store session
    _execution_sessions[session_id] = {
        "selected_names": selected_names,
        "output_queue": [],
        "completed": False,
        "parallel": True,
        "max_concurrency": 6,
    }

    threading.Thread(
        target=_execute_scripts_async, args=(session_id, selected_names), daemon=True
    ).start()

    return {"session_id": session_id}


def _execute_scripts_async(session_id: str, selected_names: list[str]):
    session = _execution_sessions.get(session_id)
    if not session:
        return
    try:
        desty_note = "\n💡 Desty Enhanced: SystemRefId akan otomatis dikonversi ke EntityId via database\n" if "Desty" in selected_names else ""
        session["output_queue"].append(
            {"type": "output", "content": f"📋 Job yang akan dijalankan: {', '.join(selected_names) if selected_names else 'Tidak ada'}{desty_note}\n"}
        )

        if not selected_names:
            session["output_queue"].append({"type": "output", "content": "⚠️ Tidak ada Job yang terdeteksi dari input\n"})
            session["completed"] = True
            return

        def run_one(name: str):
            script_file = SCRIPTS[name]
            script_path = SCRIPTS_DIR / script_file
            suffix = " (Enhanced with EntityId Lookup)" if name == "Desty" else ""
            session["output_queue"].append({"type": "output", "content": f"🔄 Menjalankan Job {name}{suffix}...\n"})
            if not script_path.exists():
                session["output_queue"].append({"type": "output", "content": f"❌ File script tidak ditemukan: {script_file}\n\n"})
                return
            try:
                process = subprocess.Popen(
                    [sys.executable, str(script_path)],
                    cwd=str(SCRIPTS_DIR),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    env={**os.environ, "PYTHONIOENCODING": "utf-8"},
                )
                while True:
                    output = process.stdout.readline()
                    if output == "" and process.poll() is not None:
                        break
                    if output:
                        session["output_queue"].append({"type": "output", "content": f"[{name}] {output}"})
                rc = process.poll()
                if rc == 0:
                    session["output_queue"].append({"type": "output", "content": f"✅ {name} selesai dengan sukses\n\n"})
                else:
                    session["output_queue"].append({"type": "output", "content": f"❌ {name} selesai dengan error (exit code: {rc})\n\n"})
            except Exception as e:
                session["output_queue"].append({"type": "output", "content": f"❌ Error menjalankan Job {name}: {str(e)}\n\n"})

        if session.get("parallel"):
            max_workers = session.get("max_concurrency") or 4
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = [executor.submit(run_one, n) for n in selected_names]
                for f in futures:
                    try:
                        f.result()
                    except Exception as e:
                        session["output_queue"].append({"type": "output", "content": f"❌ Error thread job: {str(e)}\n\n"})
        else:
            for n in selected_names:
                run_one(n)

        session["completed"] = True
        session["output_queue"].append({"type": "complete", "content": ""})
    except Exception as e:
        session["output_queue"].append({"type": "output", "content": f"❌ Error eksekusi: {str(e)}\n"})
        session["completed"] = True


@otomasi_bp.get("/stream/<session_id>")
def stream_output(session_id: str):
    def generate():
        session = _execution_sessions.get(session_id)
        if not session:
            yield f"data: {json.dumps({'type': 'error', 'content': 'Session tidak ditemukan'})}\n\n"
            return
        sent_count = 0
        while not session["completed"] or sent_count < len(session["output_queue"]):
            queue = session["output_queue"]
            while sent_count < len(queue):
                item = queue[sent_count]
                yield f"data: {json.dumps(item)}\n\n"
                sent_count += 1
            if not session["completed"]:
                time.sleep(0.1)
        threading.Timer(30.0, lambda: _execution_sessions.pop(session_id, None)).start()

    return Response(generate(), mimetype="text/event-stream")


@otomasi_bp.get("/check_desty_db")
def check_desty_database():
    try:
        desty_path = SCRIPTS_DIR / "Get_Otomasi_Desty.py"
        if not desty_path.exists():
            return {
                "status": "error",
                "message": "Get_Otomasi_Desty.py tidak ditemukan",
                "database_ok": False,
                "entity_lookup_ok": False,
            }

        spec = importlib.util.spec_from_file_location("Get_Otomasi_Desty", str(desty_path))
        module = importlib.util.module_from_spec(spec)  # type: ignore
        assert spec and spec.loader
        spec.loader.exec_module(module)  # type: ignore

        get_database_connection = getattr(module, "get_database_connection", None)
        get_entity_ids_from_system_ref_ids = getattr(module, "get_entity_ids_from_system_ref_ids", None)
        if not get_database_connection or not get_entity_ids_from_system_ref_ids:
            return {
                "status": "error",
                "message": "Fungsi database tidak tersedia di Get_Otomasi_Desty.py",
                "database_ok": False,
                "entity_lookup_ok": False,
            }

        conn = get_database_connection()
        if conn:
            try:
                conn.close()
            except Exception:
                pass
            db_status = "connected"
            db_message = "Database connection successful"
        else:
            db_status = "failed"
            db_message = "Database connection failed"

        test_ids = ["DST-2508186F50VB7D", "DST-2508186F6HFKD6"]
        try:
            entity_mapping = get_entity_ids_from_system_ref_ids(test_ids)
            if entity_mapping:
                lookup_status = "working"
                lookup_message = f"EntityId lookup working (tested with {len(test_ids)} IDs)"
            else:
                lookup_status = "no_data"
                lookup_message = "EntityId lookup working but no test data found"
        except Exception as e:
            lookup_status = "error"
            lookup_message = f"EntityId lookup error: {str(e)}"

        return {
            "status": "success",
            "database_status": db_status,
            "database_message": db_message,
            "entity_lookup_status": lookup_status,
            "entity_lookup_message": lookup_message,
            "database_ok": db_status == "connected",
            "entity_lookup_ok": lookup_status in ["working", "no_data"],
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error checking database: {str(e)}",
            "database_ok": False,
            "entity_lookup_ok": False,
        }


@otomasi_bp.post("/run")
def run_script_legacy():
    inline_text = request.form.get("orders_text", "")
    input_file_path = SCRIPTS_DIR / "input_orders.txt"
    normalized = None

    try:
        if inline_text and inline_text.strip():
            normalized = inline_text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
            while normalized and not normalized[-1].strip():
                normalized.pop()
            final_text = "\r\n".join(normalized) + ("\r\n" if normalized else "")
            tmp_path = input_file_path.with_suffix(".tmp")
            tmp_path.write_text(final_text, encoding="utf-8")
            os.replace(tmp_path, input_file_path)
            non_empty_lines = sum(1 for l in normalized if l.strip())
            input_info = f"Input diperbarui dari textarea: {non_empty_lines} baris disimpan ke {html.escape(str(input_file_path.name))}."
        else:
            if input_file_path.exists():
                input_info = f"Tidak ada input baru; menggunakan isi {html.escape(str(input_file_path.name))} yang sudah ada."
            else:
                input_info = f"Tidak ada input dan file {html.escape(str(input_file_path.name))} belum ada."
    except Exception as e:
        input_info = f"Gagal menyimpan input: {html.escape(str(e))}"

    if normalized is None:
        if input_file_path.exists():
            try:
                text = input_file_path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                text = input_file_path.read_text(encoding="latin-1")
            normalized = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
        else:
            normalized = []

    flags = {"Tiktok": False, "Desty": False, "Lazada": False, "Shopee": False, "Jubelio": False, "Ginee": False}
    for line in normalized:
        if not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        order_token = parts[1].strip().upper()
        if order_token.startswith("TTS") or order_token.startswith("579"):
            flags["Tiktok"] = True
        if (
            order_token.startswith("DST-")
            or order_token.startswith("1954")
            or order_token.startswith("1955")
            or order_token.startswith("1956")
        ):
            flags["Desty"] = True
        if order_token.startswith("LZ-") or order_token.startswith("264") or order_token.startswith("273"):
            flags["Lazada"] = True
        if order_token.startswith("SHOPEE") or order_token.startswith("25"):
            flags["Shopee"] = True
        if order_token.startswith("GN-") or order_token.startswith("GN"):
            flags["Ginee"] = True
        if (
            order_token.startswith("SP-")
            or order_token.startswith("TT-")
            or order_token.startswith("TP-")
            or order_token.startswith("LZ-")
        ):
            flags["Jubelio"] = True

    selected_names = [name for name in SCRIPTS.keys() if flags.get(name, False)]
    return f"Script terdeteksi: {selected_names}"


