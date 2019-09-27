import { Dialog, showDialog, MainAreaWidget } from '@jupyterlab/apputils';

import { JupyterFrontEnd } from '@jupyterlab/application';

import { Widget } from '@phosphor/widgets';

import { ServiceManager } from '@jupyterlab/services';

import { ITerminal } from '@jupyterlab/terminal';

import { Git } from './git';

/**
 * The command IDs used by the git plugin.
 */
export namespace CommandIDs {
  export const gitUI = 'git:ui';
  export const gitTerminal = 'git:create-new-terminal';
  export const gitTerminalCommand = 'git:terminal-command';
  export const gitInit = 'git:init';
  export const gitProject = 'git:project';  
  export const setupRemotes = 'git:tutorial-remotes';
  export const googleLink = 'git:google-link';
}

/**
 * Add the commands for the git extension.
 */
export function addCommands(app: JupyterFrontEnd, services: ServiceManager) {
  let { commands } = app;
  let gitApi = new Git();

  /**
   * Get the current path of the working directory.
   */
  function findCurrentFileBrowserPath(): string {
    try {
      let leftSidebarItems = app.shell.widgets('left');
      let fileBrowser = leftSidebarItems.next();
      while (fileBrowser.id !== 'filebrowser') {
        fileBrowser = leftSidebarItems.next();
      }
      return (fileBrowser as any).model.path;
    } catch (err) {}
  }

  /** Add open terminal command */
  commands.addCommand(CommandIDs.gitTerminal, {
    label: 'Open Terminal',
    caption: 'Start a new terminal session to directly use git command',
    execute: async args => {
      let currentFileBrowserPath = findCurrentFileBrowserPath();

      const main = (await commands.execute(
        'terminal:create-new',
        args
      )) as MainAreaWidget<ITerminal.ITerminal>;

      const terminal = main.content;
      try {
        terminal.session.send({
          type: 'stdin',
          content: [
            'cd "' + currentFileBrowserPath.split('"').join('\\"') + '"\n'
          ]
        });

        return main;
      } catch (e) {
        console.error(e);
        main.dispose();
      }
    }
  });

  /** Add open terminal and run command */
  commands.addCommand(CommandIDs.gitTerminalCommand, {
    label: 'Terminal Command',
    caption: 'Open a new terminal session and perform git command',
    execute: async args => {
      let currentFileBrowserPath = findCurrentFileBrowserPath();
      let changeDirectoryCommand =
        currentFileBrowserPath === ' '
          ? ''
          : 'cd "' + currentFileBrowserPath.split('"').join('\\"') + '"';
      let gitCommand = args ? (args['cmd'] as string) : '';
      let linkCommand =
        changeDirectoryCommand !== '' && gitCommand !== '' ? '&&' : '';

      const main = (await commands.execute(
        'terminal:create-new',
        args
      )) as MainAreaWidget<ITerminal.ITerminal>;

      const terminal = main.content;
      try {
        terminal.session.send({
          type: 'stdin',
          content: [changeDirectoryCommand + linkCommand + gitCommand + '\n']
        });

        return main;
      } catch (e) {
        console.error(e);
        main.dispose();
      }
    }
  });

  /** Add open/go to git interface command */
  commands.addCommand(CommandIDs.gitUI, {
    label: 'Git Interface',
    caption: 'Go to Git user interface',
    execute: () => {
      try {
        app.shell.activateById('jp-git-sessions');
      } catch (err) {}
    }
  });

  /** Add git init command */
  commands.addCommand(CommandIDs.gitInit, {
    label: 'Init',
    caption: ' Create an empty Git repository or reinitialize an existing one',
    execute: () => {
      let currentFileBrowserPath = findCurrentFileBrowserPath();
      showDialog({
        title: 'Initialize a Repository',
        body: 'Do you really want to make this directory a Git Repo?',
        buttons: [Dialog.cancelButton(), Dialog.warnButton({ label: 'Yes' })]
      }).then(result => {
        if (result.button.accept) {
          gitApi.init(currentFileBrowserPath);
        }
      });
    }
  });

  /** Add git project command */
  commands.addCommand(CommandIDs.gitProject, {
    label: 'Project',
    caption: ' Create an empty Git repository or reinitialize an existing one',
    execute: async () => {
     const dialog = new Dialog({
      title: 'Create Git Project',
      body: new Project(),
      focusNodeSelector: 'input',
      buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Create' })]
    });
	
	 const result = await dialog.launch();
    dialog.dispose();

    if (typeof result.value !== 'undefined' && result.value) {
      const projectNmae: string = result.value;
      gitApi
      .clone(currentFileBrowserPath, projectNmae)
      .then(response => {
        if (response.code !== 0) {
           return showDialog({
      title: 'Creation failed',
      body: response.message,
      buttons: [Dialog.warnButton({ label: 'DISMISS' })]
    }).then(() => {
      // NO-OP
    });
        }
      })
    } else {
      // NOOP
    }
    }
  });  

  /** Add remote tutorial command */
  commands.addCommand(CommandIDs.setupRemotes, {
    label: 'Set Up Remotes',
    caption: 'Learn about Remotes',
    execute: () => {
      window.open(
        'https://www.atlassian.com/git/tutorials/setting-up-a-repository'
      );
    }
  });

  /** Add remote tutorial command */
  commands.addCommand(CommandIDs.googleLink, {
    label: 'Something Else',
    caption: 'Dummy Link ',
    execute: () => {
      window.open('https://www.google.com');
    }
  });
  
  
  
  
  
  /**
 * The UI for the form fields shown within the Project.
 */
class Project extends Widget {
  /**
   * Create a redirect form.
   */
  constructor() {
    super({ node: Project.createFormNode() });
  }

  private static createFormNode(): HTMLElement {
    const node = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');
    const text = document.createElement('span');
    const warning = document.createElement('div');

    node.className = 'jp-RedirectForm';
    warning.className = 'jp-RedirectForm-warning';
    text.textContent = 'Enter the Clone URI of the repository';
    input.placeholder = '';

    label.appendChild(text);
    label.appendChild(input);
    node.appendChild(label);
    node.appendChild(warning);
    return node;
  }

  /**
   * Returns the input value.
   */
  getValue(): string {
    return encodeURIComponent(this.node.querySelector('input').value);
  }
}
  
}
