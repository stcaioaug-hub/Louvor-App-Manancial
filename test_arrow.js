const props = {
  onUpdateSong: async (x) => { console.log("Prop called with", x); }
};

const component = {
  render(props) {
    const { onUpdateSong } = props;
    
    const wizard = {
      onUpdateSong: async (songId, updates) => {
        console.log("Wizard onUpdateSong called");
        await onUpdateSong({ id: songId, ...updates });
      }
    };
    
    return wizard;
  }
};

const w = component.render(props);
w.onUpdateSong(1, { title: "Test" }).then(() => console.log("Done"));
