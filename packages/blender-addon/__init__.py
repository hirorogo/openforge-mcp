"""
OpenForge MCP - Blender Addon
Controls Blender via natural language AI through the Model Context Protocol.
"""

bl_info = {
    "name": "OpenForge MCP",
    "author": "OpenForge Contributors",
    "version": (1, 0, 0),
    "blender": (3, 6, 0),
    "location": "View3D > Sidebar > OpenForge",
    "description": "MCP server enabling AI control of Blender via natural language",
    "category": "System",
}

import bpy
from typing import List, Type

from . import server
from . import ui_panel


class OpenForgeMCPPreferences(bpy.types.AddonPreferences):
    bl_idname = __package__

    port: bpy.props.IntProperty(
        name="Server Port",
        description="TCP port for the MCP server",
        default=19801,
        min=1024,
        max=65535,
    )

    auto_start: bpy.props.BoolProperty(
        name="Auto Start Server",
        description="Automatically start the TCP server when the addon is enabled",
        default=True,
    )

    def draw(self, context: bpy.types.Context) -> None:
        layout = self.layout
        layout.prop(self, "port")
        layout.prop(self, "auto_start")


_classes: List[Type] = [
    OpenForgeMCPPreferences,
    ui_panel.OPENFORGE_OT_start_server,
    ui_panel.OPENFORGE_OT_stop_server,
    ui_panel.OPENFORGE_PT_main_panel,
]


def register() -> None:
    for cls in _classes:
        bpy.utils.register_class(cls)

    prefs = bpy.context.preferences.addons.get(__package__)
    if prefs and prefs.preferences.auto_start:
        port = prefs.preferences.port
        server.start_server(port)


def unregister() -> None:
    server.stop_server()

    for cls in reversed(_classes):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    register()
