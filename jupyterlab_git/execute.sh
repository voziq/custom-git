#!/bin/bash
gitlabToken=LGvfX6XFT9fQuSisxY5g
gitlabURL="https://git.voziq.com"
projectApi="/api/v4/projects"
userApi="/api/v4/users"
groupApi="/api/v4/groups"
namespacesAPI="/api/v4/namespaces"
gitlabProjTemplate="https://git.voziq.com/root/models-project-template.git"
defaultNamespace="ailab"
ProjectLocalBasePath="$1"
projectName="$2"
projectUserName="$3"

#Verify If Project Exists in GitLab
isGitlabProjectExist(){
        existStatus=""
        responseCode=""
        responseLength=""
        apiRequest=$(curl -k --write-out "%{http_code};%{size_download}" --silent --connect-timeout 10 --no-keepalive --output /dev/null \
                                        -XGET --header "PRIVATE-TOKEN: $gitlabToken" $gitlabURL/$projectApi?search="$1")
        IFS=';' read -a apiResponse <<< "${apiRequest}"
        responseCode=${apiResponse[0]}
        responseLength=${apiResponse[1]}
        if ([ $responseCode -eq 200 ] && [ $responseLength -gt 2 ]); then
                existStatus=1
        else
                existStatus=0
        fi
        echo $existStatus
}

#Verify If Project Directory Exist in Local Storage
isProjectDirExist(){
        basePath="$1"
        projectName="$2"
        existStatus=""
        if [ -d "$basePath/$projectName" ]; then
                existStatus=1
        else
                existStatus=0
        fi
        echo $existStatus
}

#Clone Project Template From GitLab
performProjectTemplateClone(){
    targetDirectory="$ProjectLocalBasePath"
        projectRepoURL="$1"
	echo "Repo URL"
	echo $projectRepoURL
	cd "$targetDirectory/"
        git clone "$gitlabProjTemplate"
	mv "$targetDirectory/models-project-template" "$targetDirectory/$projectName"
        rm -rf "$targetDirectory/$projectName/.git"
	cd "$targetDirectory/$projectName/"
        git init
        git remote add origin "$projectRepoURL"
        git add .
        git commit -m "Initial Commit With Project Structure"
        git push -u origin master
}

#Get User Attributes From GitLab
gitlabAPIGetUserAttributes(){
                gitlabUserId=""
                apiResponseUserId=
                apiRequest=$(curl -k --write-out "%{http_code};%{size_download}" --silent --connect-timeout 10 --no-keepalive \
                                        -XGET --header "PRIVATE-TOKEN: $gitlabToken" $gitlabURL/$userApi?username="$1")
                gitlabUserId=$(echo $apiRequest | grep -o -E "\"id\":[0-9]+" | awk -F\: '{print $2}')
                echo $gitlabUserId
}

#Get User Attributes From GitLab
gitlabAPIGetNamespaceAttributes(){
                gitlabGroupId=""
                gitlabNameSpace="$1"
                apiRequest=$(curl -k --write-out "%{http_code};%{size_download}" --silent --connect-timeout 10 --no-keepalive \
                                        -XGET --header "PRIVATE-TOKEN: $gitlabToken" $gitlabURL/$namespacesAPI?search="$gitlabNameSpace")
                gitlabGroupId=$(echo $apiRequest | grep -o -E "\"id\":[0-9]+" | awk -F\: '{print $2}')
                echo $gitlabGroupId
}

#Create GitLab Project For User
gitlabAPICreateProject(){
                gitlabProjectName=$1
                ProjectLocalBasePath=$2
                gitlabUserId=$(gitlabAPIGetUserAttributes "$3")
                gitlabProjectNamespaceId=$(gitlabAPIGetNamespaceAttributes "$4")
                existStatus=""
        if [[ $(isGitlabProjectExist "$gitlabProjectName") -eq 1 ]] || [[ $(isProjectDirExist "$gitlabProjectName") -eq 1 ]]; then
                existStatus=1
        else
                        apiRequest=$(curl -k --silent --connect-timeout 10 --no-keepalive \
                                        -XPOST --header "PRIVATE-TOKEN: $gitlabToken" "$gitlabURL/$projectApi/user/$gitlabUserId?name="$gitlabProjectName"&namespace_id=$gitlabProjectNamespaceId")
                        apiprojectRepoURL=$(echo $apiRequest | grep -Po '(?<="http_url_to_repo":")[^"]+')
                        performProjectTemplateClone $apiprojectRepoURL
                        existStatus=0
        fi
                echo $existStatus
}

gitlabAPICreateProject "$projectName" "$ProjectLocalBasePath" "$projectUserName" "$defaultNamespace"
