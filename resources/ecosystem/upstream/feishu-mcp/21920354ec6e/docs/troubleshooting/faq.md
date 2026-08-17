## Frequently Asked Questions (FAQ)

Below are common issues and solutions, with additional explanations to help identify causes and process quickly.

### Unable to connect to Feishu/Lark API

Solutions:
- Check local network connection and proxy settings.
- Verify that `APP_ID` and `APP_SECRET` are filled in correctly.
- Test if you can access the open platform API domain normally (such as `https://open.feishu.cn` or `https://open.larksuite.com`).

### Error when using user_access_token

Solutions:
- Check if the token has expired (usually valid for 2 hours).
- It's recommended to use `login` to obtain and save user tokens first.
- If using in server/CI environment, ensure secure token management and proper refresh.

### Permission denied when calling certain APIs after starting MCP service

Solutions:
- Enable corresponding API permissions for the application in the developer console and wait for approval.
- For scenarios calling as a user (requiring `user_access_token`), ensure the authorization scope (`scope`) includes the corresponding permissions. If not, you need to login again.

### Image or file upload/download related API failures

Solutions:
- The current version does not support file/image upload and download yet. These capabilities will be supported in future versions.

### Garbled characters in Windows terminal

Solutions:
- Execute `chcp 65001` in Command Prompt to switch to UTF-8.
- PowerShell users can adjust fonts or related terminal settings to improve compatibility.

### Permission errors during installation

Solutions:
- macOS/Linux: Use `sudo npm install -g @larksuiteoapi/lark-mcp` or adjust npm global path permissions.
- Windows: Try running Command Prompt as administrator.

### Token limit exceeded prompt after starting MCP service

Solutions:
- Use `-t` (or `-t` in MCP configuration `args`) to reduce the number of enabled APIs.
- Use models that support larger context lengths.

### Unable to connect or receive messages in SSE/Streamable mode

Solutions:
- Check port usage and change ports if necessary.
- Ensure the client connects correctly to the corresponding endpoint and can handle event streams.

### Linux environment startup error [StorageManager] Failed to initialize: xxx

Note:
- Does not affect scenarios of "manually passing `user_access_token`" or "not using `user_access_token`".

`StorageManager` uses keytar for encrypted storage of `user_access_token`.

Solutions:
- Install `libsecret` dependency:
  - Debian/Ubuntu: `sudo apt-get install libsecret-1-dev`
  - Red Hat-based: `sudo yum install libsecret-devel`
  - Arch Linux: `sudo pacman -S libsecret`


