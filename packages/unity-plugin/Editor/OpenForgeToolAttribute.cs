using System;

namespace OpenForge.Editor
{
    [AttributeUsage(AttributeTargets.Method)]
    public class OpenForgeToolAttribute : Attribute
    {
        public string Name { get; }
        public string Description { get; }

        public OpenForgeToolAttribute(string name, string description)
        {
            Name = name;
            Description = description;
        }
    }
}
