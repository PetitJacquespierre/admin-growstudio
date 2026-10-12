param(
    [string]$OutputFile = "$PSScriptRoot\live_leads.json"
)

Write-Host "Iniciando escaneo global en Reddit..." -ForegroundColor Cyan

$urls = @(
    "https://www.reddit.com/r/forhire/new/.json?limit=25",
    "https://www.reddit.com/r/freelance_forhire/new/.json?limit=25"
)

$leads = @()
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GrowStudioBot/2.0"

foreach ($url in $urls) {
    try {
        $response = Invoke-RestMethod -Uri $url -UserAgent $ua -TimeoutSec 10 -ErrorAction SilentlyContinue

        if ($response -and $response.data -and $response.data.children) {
            foreach ($child in $response.data.children) {
                $post = $child.data
                $title = $post.title
                $text = $post.selftext
                $author = "@" + $post.author
                $lowerText = ($title + " " + $text).ToLower()

                if ($lowerText -match "\[for hire\]") {
                    continue
                }

                if ($lowerText -match "\[hiring\]" -or $lowerText -match "looking for" -or $lowerText -match "need a website") {
                    
                    $budget = "$150 - $350 USD"
                    if ($lowerText -match "\$\d+") {
                        $budget = $matches[0] + " USD"
                    }

                    $score = 88
                    $badge = "HOT"
                    if ($lowerText -match "urgent" -or $lowerText -match "asap") {
                        $score = 95
                        $badge = "FUEGO"
                    }

                    $lead = [PSCustomObject]@{
                        id = "lead-live-" + $post.id
                        author = $author
                        platform = "Reddit (" + $post.subreddit_name_prefixed + ")"
                        lang = "en"
                        langLabel = "English 🇺🇸"
                        time = "En vivo"
                        score = $score
                        badge = $badge
                        budget = $budget
                        service = "Diseño Web / Landing"
                        text = if ($title.Length -gt 150) { $title.Substring(0, 150) + "..." } else { $title }
                        urgency = if ($badge -eq "FUEGO") { "Inmediata" } else { "Esta semana" }
                        status = "NUEVO"
                        url = "https://reddit.com" + $post.permalink
                    }
                    $leads += $lead
                }
            }
        }
    } catch {
        Write-Host "Reintentando canal..." -ForegroundColor Yellow
    }
}

if ($leads.Count -gt 0) {
    $leads | ConvertTo-Json -Depth 4 | Set-Content -Path $OutputFile -Encoding UTF8
    Write-Host "Leads encontrados y guardados: $($leads.Count)" -ForegroundColor Green
} else {
    Write-Host "Canales monitoreados en espera de nuevas publicaciones." -ForegroundColor Gray
}
