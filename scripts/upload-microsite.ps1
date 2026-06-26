$ftpHost = "ftp.photon-bounce.com"
$username = "photonb"
$password = "Nepidaras25!!??"
$localPath = "D:\govdao\microsite"
$remotePath = "/govdao"

function Upload-Folder {
    param(
        [string]$localDir,
        [string]$remoteDir
    )

    # 1. Create remote directory (ignore if exists)
    $uri = "ftp://$ftpHost$remoteDir"
    $req = [System.Net.FtpWebRequest]::Create($uri)
    $req.Credentials = New-Object System.Net.NetworkCredential($username, $password)
    $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
    try {
        $resp = $req.GetResponse()
        $resp.Close()
        Write-Host "Created remote directory: $remoteDir"
    } catch {
        # Directory likely already exists, ignore error
    }

    # 2. Upload files in this directory
    $files = Get-ChildItem -Path $localDir -File
    foreach ($file in $files) {
        $targetUri = "ftp://$ftpHost$remoteDir/$($file.Name)"
        Write-Host "Uploading $($file.FullName) to $targetUri"
        $req = [System.Net.FtpWebRequest]::Create($targetUri)
        $req.Credentials = New-Object System.Net.NetworkCredential($username, $password)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $req.ContentLength = $bytes.Length
        $stream = $req.GetRequestStream()
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Close()
        
        $resp = $req.GetResponse()
        $resp.Close()
    }

    # 3. Recurse into subdirectories
    $subDirs = Get-ChildItem -Path $localDir -Directory
    foreach ($subDir in $subDirs) {
        Upload-Folder -localDir $subDir.FullName -remoteDir "$remoteDir/$($subDir.Name)"
    }
}

# Run the upload starting from the microsite root
Upload-Folder -localDir $localPath -remoteDir $remotePath
Write-Host "Microsite upload completed successfully!"
