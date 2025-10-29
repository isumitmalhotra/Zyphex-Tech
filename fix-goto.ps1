$content = Get-Content 'e2e\responsive-design.spec.ts' -Raw
$content = $content -replace "await page\.goto\('/dashboard/pages'\);", "await page.goto('/dashboard/pages', { waitUntil: 'domcontentloaded' });"
Set-Content 'e2e\responsive-design.spec.ts' -Value $content -NoNewline
Write-Host "Updated responsive-design.spec.ts with faster navigation wait condition"
