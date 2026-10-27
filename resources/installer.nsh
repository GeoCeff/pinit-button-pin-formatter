!macro customInstall
  DetailPrint "Installing the offline Microsoft Visual C++ runtime..."
  ExecWait '"$INSTDIR\resources\ghostscript\vcredist_x64.exe" /install /quiet /norestart' $0
  ${If} $0 != 0
  ${AndIf} $0 != 1638
  ${AndIf} $0 != 3010
    MessageBox MB_OK|MB_ICONSTOP "The Microsoft Visual C++ runtime could not be installed (code $0). Setup cannot complete. Restart Windows and run Setup again."
    Abort
  ${EndIf}
  ${If} $0 == 3010
    SetRebootFlag true
  ${EndIf}
!macroend
