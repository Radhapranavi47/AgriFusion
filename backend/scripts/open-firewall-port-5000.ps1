# Run in elevated PowerShell (Run as administrator) if LAN clients cannot reach the API.
netsh advfirewall firewall add rule name="NodeJS5000" dir=in action=allow protocol=TCP localport=5000
