import os

def correct_import_paths(root_folder, config_file):
    for subdir, _, files in os.walk(root_folder):
        for file in files:
            if file.endswith('.js'):# or file.endswith('.jsx'):
                file_path = os.path.join(subdir, file)
                with open(file_path, 'r') as f:
                    lines = f.readlines()
                
                with open(file_path, 'w') as f:
                    for line in lines:
                        if 'import feConfig from' in line:
                            relative_path = os.path.relpath(config_file, start=subdir)
                            new_line = f'import feConfig from "{relative_path}"\n'
                            f.write(new_line)
                        else:
                            f.write(line)

# remove "import getConfig from 'next/config';"
# replace "const { publicRuntimeConfig } = getConfig();" with "import feConfig from '../config.json';"
def replace_props(root_folder, config_file):
    for subdir, _, files in os.walk(root_folder):
        for file in files:
            if file.endswith('.js') or file.endswith('.jsx'):
                file_path = os.path.join(subdir, file)
                with open(file_path, 'r') as f:
                    lines = f.readlines()
                
                with open(file_path, 'w') as f:
                    for line in lines:
                        if "import getConfig from 'next/config';" in line:
                            continue
                        elif "const { publicRuntimeConfig } = getConfig();" in line:
                            relative_path = os.path.relpath(config_file, start=subdir)
                            new_line = f'import feConfig from "{relative_path}";\n'
                            f.write(new_line)
                        else:
                            f.write(line)
    

if __name__ == "__main__":
    components_folder = '/home/user/restart-sbh/synbiohub3/frontend/components'
    config_file_path = '/home/user/restart-sbh/synbiohub3/frontend/config.json'
    
    # replace_props(components_folder, config_file_path)
    
    #correct_import_paths(components_folder, config_file_path)
    
    correct_import_paths('/home/user/restart-sbh/synbiohub3/frontend/pages', config_file_path)
    