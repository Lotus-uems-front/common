#!/bin/bash

# 0 = All services synced
# 1 = Some services not synced
# 2 = Error getting commit from any service

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Minimal sync checker for multiple services
SERVICES=("server_auth" "server_file" "server_personal" "server_platform" "server_trade" "server_socket" "server_queue")

check_service() {
    local service=$1
    local staging_url="https://test2.back-${service#server_}.lotus-uems.ru/status"
    local prod_url="https://back-${service#server_}.lotus-uems.ru/status"
    
    staging_commit=$(curl -s "$staging_url" | jq -r '.commitHash' 2>/dev/null)
    prod_commit=$(curl -s "$prod_url" | jq -r '.commitHash' 2>/dev/null)
    
    if [ "$staging_commit" = "null" ] || [ -z "$staging_commit" ]; then
        echo -e "${RED}$service: ERROR - Cannot get staging commit${NC}"
        return 2
    fi
    
    if [ "$prod_commit" = "null" ] || [ -z "$prod_commit" ]; then
        echo -e "${RED}$service: ERROR - Cannot get production commit${NC}"
        return 2
    fi
    
    if [ "$staging_commit" = "$prod_commit" ]; then
        echo -e "${GREEN}$service: SYNCED${NC}"
        return 0
    else
        echo -e "${YELLOW}$service: NOT SYNCED${NC}"
        echo "  Staging: $staging_commit"
        echo "  Production: $prod_commit"
        return 1
    fi
}

# Check all services
all_synced=true
has_error=false

for service in "${SERVICES[@]}"; do
    check_service "$service"
    result=$?
    
    if [ $result -eq 2 ]; then
        has_error=true
    elif [ $result -eq 1 ]; then
        all_synced=false
    fi
done

# Exit with appropriate code
if [ "$has_error" = true ]; then
    exit 2
elif [ "$all_synced" = false ]; then
    exit 1
else
    exit 0
fi 