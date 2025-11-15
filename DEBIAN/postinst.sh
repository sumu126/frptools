#!/bin/bash

# Create desktop shortcuts
# 获取当前图形界面登录的用户名
TARGET_USER=$(who | grep "(:0)" | awk '{print $1}')

if [ -z "$TARGET_USER" ]; then
    TARGET_USER=$(logname 2>/dev/null || whoami)
fi

USER_HOME=$(getent passwd "$TARGET_USER" | cut -d: -f6)

if [ -z "$USER_HOME" ]; then
    echo "Error: Could not determine user home directory."
else
    if [ -d "$USER_HOME/桌面" ]; then
        DESKTOP_DIR="$USER_HOME/桌面"
    elif [ -d "$USER_HOME/Desktop" ]; then
        DESKTOP_DIR="$USER_HOME/Desktop"
    else
        echo "Warning: Could not find '桌面' or 'Desktop' directory. Skipping creation of desktop shortcut."
    fi

    if [ -n "$DESKTOP_DIR" ]; then
        DESKTOP_FILE="$DESKTOP_DIR/maintenancealarm.desktop"

        if cp /opt/maintenancealarm/resources/build/maintenancealarm.desktop "$DESKTOP_FILE" > /dev/null 2>&1; then
            echo "Successfully copied .desktop file to $DESKTOP_DIR."
        else
            echo "Error: Failed to copy .desktop file to $DESKTOP_DIR."
        fi

        # 设置所有者权限
        chown "$TARGET_USER:$TARGET_USER" "$DESKTOP_FILE" > /dev/null 2>&1 || echo "Error: Failed to change ownership for $DESKTOP_FILE."

        # 设置权限
        chmod u+rwx,go+rx "$DESKTOP_FILE" > /dev/null 2>&1 || echo "Error: Failed to set permissions on $DESKTOP_FILE."
        
        echo "Permissions have been adjusted for $DESKTOP_FILE."
    fi
fi
