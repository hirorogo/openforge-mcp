def openforge_tool(name: str, description: str):
    """Decorator to register a function as an OpenForge tool."""
    def decorator(func):
        func._openforge_name = name
        func._openforge_description = description
        return func
    return decorator
