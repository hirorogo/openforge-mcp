using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEditor.PackageManager;
using UnityEditor.PackageManager.Requests;
using UnityEngine;
using PackageInfo = UnityEditor.PackageManager.PackageInfo;

namespace OpenForge.Editor.Tools
{
    public static class PackageManagerTools
    {
        public static void Register()
        {
            ToolExecutor.Register("install_package", InstallPackage);
            ToolExecutor.Register("remove_package", RemovePackage);
            ToolExecutor.Register("list_packages", ListPackages);
            ToolExecutor.Register("search_packages", SearchPackages);
            ToolExecutor.Register("get_package_info", GetPackageInfo);
            ToolExecutor.Register("update_package", UpdatePackage);
        }

        private static ToolResult InstallPackage(Dictionary<string, string> p)
        {
            string packageId = GetRequiredParam(p, "package_id");
            string version = GetParam(p, "version", "");

            string identifier = string.IsNullOrEmpty(version) ? packageId : $"{packageId}@{version}";

            AddRequest request = Client.Add(identifier);
            WaitForRequest(request);

            if (request.Status == StatusCode.Success)
            {
                PackageInfo info = request.Result;
                return new ToolResult
                {
                    success = true,
                    message = $"Installed package '{info.displayName}' version {info.version}",
                    data = PackageInfoToJson(info)
                };
            }
            else
            {
                return Fail($"Failed to install '{identifier}': {request.Error?.message ?? "Unknown error"}");
            }
        }

        private static ToolResult RemovePackage(Dictionary<string, string> p)
        {
            string packageName = GetRequiredParam(p, "package_id");

            RemoveRequest request = Client.Remove(packageName);
            WaitForRequest(request);

            if (request.Status == StatusCode.Success)
            {
                return new ToolResult
                {
                    success = true,
                    message = $"Removed package '{packageName}'"
                };
            }
            else
            {
                return Fail($"Failed to remove '{packageName}': {request.Error?.message ?? "Unknown error"}");
            }
        }

        private static ToolResult ListPackages(Dictionary<string, string> p)
        {
            bool offlineMode = GetParam(p, "offline", "false") == "true";

            ListRequest request = Client.List(offlineMode);
            WaitForRequest(request);

            if (request.Status == StatusCode.Success)
            {
                StringBuilder sb = new StringBuilder("[");
                bool first = true;
                foreach (PackageInfo info in request.Result)
                {
                    if (!first) sb.Append(",");
                    first = false;
                    sb.Append(PackageInfoToJson(info));
                }
                sb.Append("]");

                int count = 0;
                foreach (var _ in request.Result) count++;

                return new ToolResult
                {
                    success = true,
                    message = $"Found {count} installed package(s)",
                    data = sb.ToString()
                };
            }
            else
            {
                return Fail($"Failed to list packages: {request.Error?.message ?? "Unknown error"}");
            }
        }

        private static ToolResult SearchPackages(Dictionary<string, string> p)
        {
            string query = GetParam(p, "query", "");

            SearchRequest request;
            if (string.IsNullOrEmpty(query))
                request = Client.SearchAll();
            else
                request = Client.Search(query);

            WaitForRequest(request);

            if (request.Status == StatusCode.Success)
            {
                StringBuilder sb = new StringBuilder("[");
                bool first = true;
                int count = 0;
                foreach (PackageInfo info in request.Result)
                {
                    if (!first) sb.Append(",");
                    first = false;
                    sb.Append(PackageInfoToJson(info));
                    count++;
                }
                sb.Append("]");

                return new ToolResult
                {
                    success = true,
                    message = $"Found {count} package(s) matching '{query}'",
                    data = sb.ToString()
                };
            }
            else
            {
                return Fail($"Search failed: {request.Error?.message ?? "Unknown error"}");
            }
        }

        private static ToolResult GetPackageInfo(Dictionary<string, string> p)
        {
            string packageName = GetRequiredParam(p, "package_id");

            // List all packages and find the matching one
            ListRequest listRequest = Client.List(true);
            WaitForRequest(listRequest);

            if (listRequest.Status == StatusCode.Success)
            {
                foreach (PackageInfo info in listRequest.Result)
                {
                    if (info.name == packageName || info.displayName == packageName)
                    {
                        StringBuilder sb = new StringBuilder("{");
                        sb.Append($"\"name\":\"{EscapeJson(info.name)}\",");
                        sb.Append($"\"displayName\":\"{EscapeJson(info.displayName)}\",");
                        sb.Append($"\"version\":\"{EscapeJson(info.version)}\",");
                        sb.Append($"\"description\":\"{EscapeJson(info.description)}\",");
                        sb.Append($"\"source\":\"{info.source}\",");
                        sb.Append($"\"status\":\"{info.source}\",");
                        sb.Append($"\"category\":\"{EscapeJson(info.category)}\",");

                        // List versions if available
                        sb.Append("\"versions\":{");
                        sb.Append($"\"compatible\":\"{EscapeJson(info.versions?.compatible ?? "")}\",");
                        sb.Append($"\"verified\":\"{EscapeJson(info.versions?.recommended ?? "")}\"");
                        sb.Append("},");

                        // Dependencies
                        sb.Append("\"dependencies\":[");
                        if (info.dependencies != null)
                        {
                            bool firstDep = true;
                            foreach (var dep in info.dependencies)
                            {
                                if (!firstDep) sb.Append(",");
                                firstDep = false;
                                sb.Append($"{{\"name\":\"{EscapeJson(dep.name)}\",\"version\":\"{EscapeJson(dep.version)}\"}}");
                            }
                        }
                        sb.Append("]");

                        sb.Append("}");

                        return new ToolResult
                        {
                            success = true,
                            message = $"Package info for '{info.displayName}' v{info.version}",
                            data = sb.ToString()
                        };
                    }
                }
            }

            // Try searching the registry
            SearchRequest searchRequest = Client.Search(packageName);
            WaitForRequest(searchRequest);

            if (searchRequest.Status == StatusCode.Success)
            {
                foreach (PackageInfo info in searchRequest.Result)
                {
                    if (info.name == packageName)
                    {
                        return new ToolResult
                        {
                            success = true,
                            message = $"Package info for '{info.displayName}' v{info.version} (not installed)",
                            data = PackageInfoToJson(info)
                        };
                    }
                }
            }

            return Fail($"Package not found: {packageName}");
        }

        private static ToolResult UpdatePackage(Dictionary<string, string> p)
        {
            string packageName = GetRequiredParam(p, "package_id");
            string targetVersion = GetParam(p, "version", "");

            // If no version specified, install without version to get latest
            string identifier = string.IsNullOrEmpty(targetVersion) ? packageName : $"{packageName}@{targetVersion}";

            AddRequest request = Client.Add(identifier);
            WaitForRequest(request);

            if (request.Status == StatusCode.Success)
            {
                PackageInfo info = request.Result;
                return new ToolResult
                {
                    success = true,
                    message = $"Updated package '{info.displayName}' to version {info.version}",
                    data = PackageInfoToJson(info)
                };
            }
            else
            {
                return Fail($"Failed to update '{packageName}': {request.Error?.message ?? "Unknown error"}");
            }
        }

        // --- Helpers ---

        private static void WaitForRequest(Request request)
        {
            // Spin-wait for the request to complete (Unity Package Manager is async).
            // In editor context this will complete within a few frames.
            int maxIterations = 100000;
            while (!request.IsCompleted && maxIterations > 0)
            {
                System.Threading.Thread.Sleep(10);
                maxIterations--;
            }
        }

        private static string PackageInfoToJson(PackageInfo info)
        {
            StringBuilder sb = new StringBuilder("{");
            sb.Append($"\"name\":\"{EscapeJson(info.name)}\",");
            sb.Append($"\"displayName\":\"{EscapeJson(info.displayName)}\",");
            sb.Append($"\"version\":\"{EscapeJson(info.version)}\",");
            sb.Append($"\"description\":\"{EscapeJson(info.description)}\",");
            sb.Append($"\"source\":\"{info.source}\"");
            sb.Append("}");
            return sb.ToString();
        }

        private static string GetParam(Dictionary<string, string> p, string key, string defaultValue = "")
        {
            return p.TryGetValue(key, out string value) ? value : defaultValue;
        }

        private static string GetRequiredParam(Dictionary<string, string> p, string key)
        {
            if (!p.TryGetValue(key, out string value) || string.IsNullOrEmpty(value))
                throw new ArgumentException($"Missing required parameter: {key}");
            return value;
        }

        private static ToolResult Fail(string message)
        {
            return new ToolResult { success = false, message = message };
        }

        private static string EscapeJson(string s)
        {
            if (s == null) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r").Replace("\t", "\\t");
        }
    }
}
