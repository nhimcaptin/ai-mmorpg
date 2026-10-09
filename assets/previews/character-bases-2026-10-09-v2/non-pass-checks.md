# Các kiểm tra chưa PASS — nguyên văn

{"id": "python.path", "status": "WARN", "detail": "other python.exe on PATH: ~/AppData/Local/Microsoft/WindowsApps/python.exe", "remedy": "PowerShell, cmd and Git Bash may resolve different interpreters; run Forge with the one shown in python.version"}
{"id": "deps.resvg-py", "status": "MISSING", "detail": "not installed; needed for codeart2d SVG rendering (PixelSpec needs only numpy and Pillow)", "remedy": "\"C:\\Users\\doanh.tran\\AppData\\Local\\Python\\pythoncore-3.14-64\\python.exe\" -m pip install \"resvg-py>=0.5,<0.6\""}
{"id": "paths.cwd", "status": "WARN", "detail": "the working folder has spaces or non-ASCII characters", "remedy": "quote every path; prefer ASCII output folder names for ffmpeg frame patterns"}
{"id": "media.api.openai", "status": "MISSING", "detail": "OPENAI_API_KEY is not configured", "remedy": "optional: set OPENAI_API_KEY in the environment or in the user config file to make the OpenAI API an image route (GPT Image)"}
{"id": "media.api.gemini", "status": "MISSING", "detail": "GOOGLE_API_KEY or GEMINI_API_KEY is not configured", "remedy": "optional: set GOOGLE_API_KEY or GEMINI_API_KEY in the environment or in the user config file to make the Google Gemini API an image route (Gemini image models)"}
{"id": "media.api.xai", "status": "MISSING", "detail": "XAI_API_KEY is not configured", "remedy": "optional: set XAI_API_KEY in the environment or in the user config file to make the xAI API an image and video route (Grok Imagine)"}
{"id": "media.api.byteplus", "status": "MISSING", "detail": "ARK_API_KEY is not configured", "remedy": "optional: set ARK_API_KEY in the environment or in the user config file to make the BytePlus ModelArk API an image and video route (Seedream, Seedance)"}
{"id": "media.api.fal", "status": "MISSING", "detail": "FAL_KEY is not configured", "remedy": "optional: set FAL_KEY in the environment or in the user config file to make the fal.ai API a reference-edit and video route (Kling, Veo, Luma, MiniMax, Wan, Vidu, LTX)"}
{"id": "cli.grok", "status": "MISSING", "detail": "Grok Build CLI not found on PATH or in $GROK_HOME/bin", "remedy": "optional: install the Grok Build CLI and sign in, then verify a route"}
male: {"id": "body_scale_cv", "status": "skipped", "value": 0.0, "threshold": null}
male: {"id": "anchor_y_std", "status": "skipped", "value": 0.0, "threshold": null}
female: {"id": "body_scale_cv", "status": "skipped", "value": 0.0, "threshold": null}
female: {"id": "anchor_y_std", "status": "skipped", "value": 0.0, "threshold": null}
