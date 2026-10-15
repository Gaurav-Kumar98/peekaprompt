' Double-click me to launch PeekaPrompt (no console window).
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
exe = dir & "\node_modules\electron\dist\electron.exe"
If Not fso.FileExists(exe) Then
  MsgBox "Electron isn't installed yet." & vbCrLf & "Open a terminal in this folder and run: npm install", 48, "PeekaPrompt"
  WScript.Quit
End If
CreateObject("WScript.Shell").Run """" & exe & """ """ & dir & """", 0, False
