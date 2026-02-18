"""Generate username variations for different platforms."""
from typing import List, Set

def generate_variations(username: str, platform_id: str) -> List[str]:
    """
    Generate username variations based on platform-specific rules.
    
    Args:
        username: The base username to generate variations for
        platform_id: The platform identifier (e.g., 'bluesky', 'github')
    
    Returns:
        List of username variations to try, ordered by likelihood
    """
    variations: Set[str] = {username}  # Always include original
    
    # Bluesky: supports domain handles like username.bsky.social or custom domains
    # Note: Bluesky custom domain handles are case-sensitive (lowercase required)
    if platform_id == "bluesky":
        username_lower = username.lower()
        # .bsky.social is the most common handle format - try it first
        variations.add(f"{username_lower}.bsky.social")
        variations.add(f"{username}.bsky.social")
        # Try common domain extensions (both original case and lowercase)
        for ext in [".com", ".net", ".org", ".io", ".dev"]:
            variations.add(f"{username}{ext}")
            variations.add(f"{username_lower}{ext}")
    
    # GitHub, GitLab: dots, hyphens, underscores
    elif platform_id in ["github", "gitlab"]:
        # Try with hyphens and underscores
        if "_" not in username and "-" not in username:
            variations.add(username.replace(".", "-"))
            variations.add(username.replace(".", "_"))
            variations.add(username.replace(".", ""))
    
    # Twitter/X: underscores common
    elif platform_id == "twitter":
        if "_" not in username:
            variations.add(f"{username}_")
            variations.add(f"_{username}")
            variations.add(username.replace(".", "_"))
            variations.add(username.replace("-", "_"))
    
    # Instagram: dots and underscores, no hyphens
    elif platform_id == "instagram":
        if "." not in username and "_" not in username:
            variations.add(username.replace("-", "."))
            variations.add(username.replace("-", "_"))
            variations.add(f"{username}_")
            variations.add(f"_{username}")
    
    # Reddit: underscores and hyphens
    elif platform_id == "reddit":
        if "_" not in username and "-" not in username:
            variations.add(username.replace(".", "_"))
            variations.add(username.replace(".", "-"))
            variations.add(username.replace(".", ""))
    
    # LinkedIn: hyphens in URLs
    elif platform_id == "linkedin":
        if "-" not in username:
            variations.add(username.replace(".", "-"))
            variations.add(username.replace("_", "-"))
            variations.add(username.replace(".", ""))
    
    # TikTok: dots and underscores
    elif platform_id == "tiktok":
        if "." not in username and "_" not in username:
            variations.add(username.replace("-", "."))
            variations.add(username.replace("-", "_"))
    
    # YouTube: dots, hyphens, underscores all allowed
    elif platform_id == "youtube":
        if "." not in username and "_" not in username and "-" not in username:
            variations.add(username.replace(" ", ""))
    
    # Steam: underscores and hyphens
    elif platform_id == "steam":
        if "_" not in username and "-" not in username:
            variations.add(username.replace(".", "_"))
            variations.add(username.replace(".", "-"))
            variations.add(username.replace(".", ""))
    
    # For all platforms: try common patterns
    # Remove dots if present
    if "." in username:
        variations.add(username.replace(".", ""))
    
    # Try first+last if there's a dot (e.g., luke.steuber -> lukesteuber)
    if "." in username and username.count(".") == 1:
        parts = username.split(".")
        variations.add("".join(parts))
        variations.add("_".join(parts))
        variations.add("-".join(parts))
    
    # Bluesky: prioritize .bsky.social handle over bare username because bare
    # usernames without a domain are not valid Bluesky handles and always fail.
    if platform_id == "bluesky":
        username_lower = username.lower()
        bsky_handle = f"{username_lower}.bsky.social"
        ordered = [bsky_handle]
        # Add remaining variations excluding the .bsky.social one already added
        rest = sorted(
            [v for v in variations if v != bsky_handle],
            key=lambda x: (len(x), x)
        )
        ordered.extend(rest)
        return ordered

    # Convert to list and sort by likelihood (original first, then shorter variations)
    result = [username]  # Original always first
    other_variations = sorted(
        [v for v in variations if v != username],
        key=lambda x: (len(x), x)  # Prefer shorter, then alphabetical
    )
    result.extend(other_variations)

    return result


def should_try_variations(platform_id: str) -> bool:
    """
    Check if a platform should use username variations.
    
    Some platforms are very strict about usernames and variations
    would just waste API calls.
    """
    # Platforms that benefit from variations
    variation_platforms = {
        "bluesky", "github", "gitlab", "twitter", "instagram",
        "reddit", "linkedin", "tiktok", "youtube", "steam",
        "twitch", "medium", "soundcloud"
    }
    return platform_id in variation_platforms
