fetch('family.json')
    .then(response => response.json())
    .then(data => {

        function convert(person) {

            const node = {
                text: {
                    name: person.name
                },
                HTMLclass: "family-node"
            };

            if (person.children) {
                node.children = person.children.map(convert);
            }

            return node;
        }

        var chartConfig = {
            chart: {
                container: "#tree-container",
                rootOrientation: "NORTH",
                connectors: {
                    type: "step"
                },
                node: {
                    HTMLclass: "family-node"
                }
            },

            nodeStructure: convert(data)
        };

        new Treant(chartConfig);
    });

