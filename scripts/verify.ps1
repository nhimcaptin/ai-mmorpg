[CmdletBinding()]
param(
    [switch]$E2E,
    [ValidateRange(1, 240)][int]$MaxMinutes = 30
)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskArgs = @((Join-Path $PSScriptRoot 'auto-dev.mjs'), 'verify', '--root', $taskRoot,
    '--max-minutes', "$MaxMinutes")
if ($E2E) { $taskArgs += '--e2e' }
& node @taskArgs
exit $LASTEXITCODE
