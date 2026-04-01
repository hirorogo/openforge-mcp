"""
Blender sidebar panel for OpenForge MCP.

Displays server status, port, connected clients, and start/stop controls
in the 3D Viewport N-panel under the "OpenForge" category.
"""

import bpy
from typing import Set

from . import server


class OPENFORGE_OT_start_server(bpy.types.Operator):
    bl_idname = "openforge.start_server"
    bl_label = "Start Server"
    bl_description = "Start the OpenForge MCP TCP server"

    def execute(self, context: bpy.types.Context) -> Set[str]:
        addon_prefs = context.preferences.addons.get(__package__)
        port = 19801
        if addon_prefs:
            port = addon_prefs.preferences.port

        try:
            server.start_server(port)
            self.report({"INFO"}, f"OpenForge MCP server started on port {port}")
        except RuntimeError as exc:
            self.report({"ERROR"}, str(exc))
            return {"CANCELLED"}

        return {"FINISHED"}


class OPENFORGE_OT_stop_server(bpy.types.Operator):
    bl_idname = "openforge.stop_server"
    bl_label = "Stop Server"
    bl_description = "Stop the OpenForge MCP TCP server"

    def execute(self, context: bpy.types.Context) -> Set[str]:
        server.stop_server()
        self.report({"INFO"}, "OpenForge MCP server stopped")
        return {"FINISHED"}


class OPENFORGE_PT_main_panel(bpy.types.Panel):
    bl_idname = "OPENFORGE_PT_main_panel"
    bl_label = "OpenForge MCP"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "OpenForge"

    def draw(self, context: bpy.types.Context) -> None:
        layout = self.layout

        running = server.is_running()

        # -- Status section --------------------------------------------------
        box = layout.box()
        col = box.column(align=True)

        row = col.row()
        row.label(text="Status:")
        if running:
            row.label(text="Running")
        else:
            row.label(text="Stopped")

        row = col.row()
        row.label(text="Port:")
        row.label(text=str(server.get_port()))

        if running:
            row = col.row()
            row.label(text="Clients:")
            row.label(text=str(server.get_connected_clients()))

        # -- Controls --------------------------------------------------------
        layout.separator()

        if running:
            layout.operator(
                OPENFORGE_OT_stop_server.bl_idname,
                text="Stop Server",
                icon="PAUSE",
            )
        else:
            layout.operator(
                OPENFORGE_OT_start_server.bl_idname,
                text="Start Server",
                icon="PLAY",
            )
