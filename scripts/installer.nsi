; Per-user offline installer. Uninstaller is emitted during installation,
; so cross-building does not need to execute Windows code through Wine.
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"
!ifdef NSIS_WIN32_MAKENSIS
  !define BD_PACKAGE_FILES "${PROJECT_DIR}\release\win-unpacked\*"
  !define BD_UNINSTALL_FILES "${PROJECT_DIR}\release\uninstall-files.nsh"
!else
  !define BD_PACKAGE_FILES "${PROJECT_DIR}/release/win-unpacked/*"
  !define BD_UNINSTALL_FILES "${PROJECT_DIR}/release/uninstall-files.nsh"
!endif
Name "B&D Word"
InstallDir "$LOCALAPPDATA\Programs\BDWord"
RequestExecutionLevel user
SetCompressor /SOLID lzma
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\B&D Word.exe"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "German"
Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_OK "B&D Word benötigt ein Windows-System mit 64 Bit."
    Abort
  ${EndIf}
FunctionEnd
Section "B&D Word"
  SetShellVarContext current
  SetOutPath "$INSTDIR"
  File /r "${BD_PACKAGE_FILES}"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\B&D Word.lnk" "$INSTDIR\B&D Word.exe" "" "$INSTDIR\B&D Word.exe" 0
  CreateShortcut "$SMPROGRAMS\B&D Word.lnk" "$INSTDIR\B&D Word.exe" "" "$INSTDIR\B&D Word.exe" 0
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BDWord" "DisplayName" "B&D Word"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BDWord" "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BDWord" "DisplayIcon" "$INSTDIR\B&D Word.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BDWord" "UninstallString" '$\"$INSTDIR\Uninstall.exe$\"'
SectionEnd
Section "Uninstall"
  SetShellVarContext current
  Delete "$DESKTOP\B&D Word.lnk"
  Delete "$SMPROGRAMS\B&D Word.lnk"
  ; Generated from the packaged file inventory. Unknown user files stay intact.
  !include "${BD_UNINSTALL_FILES}"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BDWord"
SectionEnd
