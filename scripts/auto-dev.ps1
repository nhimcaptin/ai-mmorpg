[CmdletBinding()]
param(
    [switch]$DryRun,
    [ValidateRange(1, 100)][int]$MaxTasks = 1,
    [ValidateRange(1, 240)][int]$MaxMinutes = 30,
    [switch]$StopOnFailure
)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskArgs = @((Join-Path $PSScriptRoot 'auto-dev.mjs'), 'auto', '--root', $taskRoot,
    '--max-tasks', "$MaxTasks", '--max-minutes', "$MaxMinutes",
    '--stop-on-failure', "$StopOnFailure".ToLowerInvariant())
if ($DryRun) { $taskArgs += '--dry-run' }
& node @taskArgs
exit $LASTEXITCODE
