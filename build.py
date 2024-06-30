import os

def is_tool(name):
    """Check whether `name` is on PATH and marked as executable."""
    from shutil import which
    return which(name) is not None

def build():
    abspath = os.path.abspath(__file__)
    current_dir = os.path.dirname(abspath)
    os.chdir(current_dir)

    if(not is_tool("npm")):
        print("Node Package Manager is required to build ConfabUI, but it doesn't seem to be installed. Install NPM and try again")
        print("See https://docs.confabcomments.com/development/#prerequisites")
        exit()
    
    print("Building ConfabUI...")
    os.system(f"npm install")
    os.system("npm run build")
    print("Building ConfabUI complete!")

if __name__ == "__main__":
    build()