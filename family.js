const familyData = {
    name: "மலையப்பன் நாடார் (1800)",
    children: [
        {
            name: "சவரிமுத்து நாடார் (தகவல் இல்லை)"
        },
        {
            name: "சாந்தப்பன் நாடார் + இராயம்மை நாடாச்சி",
            children: [
                {
                    name: "மிக்கேல் அந்தோணி முத்து நாடார் (1864) + வியாகூலமரியாள்",
                    children: [
                        { name: "இருதய நாடார்" },
                        { name: "அன்பு நாடார் (சிறுவயதில் இறந்தார்)" },
                        { name: "இயேசுவடியன் நாடார்" },
                        { name: "சாந்தப்பன் நாடார்" },
                        { name: "வெள்ளையம்மாள்" }
                    ]
                },
                {
                    name: "மலையப்பன் நாடார்",
                    children: [
                        { name: "தெரியவில்லை" }
                    ]
                },
                {
                    name: "சவரிமுத்து நாடார்",
                    children: [
                        { name: "தெரியவில்லை" }
                    ]
                },
                {
                    name: "(Need to Find)"
                },
                {
                    name: "மலையப்பன் வெள்ளையா நாடார் + அன்னம்மாள்",
                    children: [
                        { name: "தங்கம்" },
                        { name: "இராசம்மாள்" },
                        { name: "அந்தோனி பிச்சை நாடார் (கோவில் பிச்சை நாடார்)" },
                        { name: "ஜெபமாலை" }
                    ]
                },
                {
                    name: "இராயப்பன் நாடார் + மரிய செல்வம் அம்மாள்",
                    children: [
                        { name: "சாந்தம்மாள்" },
                        { name: "அற்புதமணி" },
                        { name: "மரிய தாசன் நாடார்" },
                        { name: "அன்னபாகியம்" }
                    ]
                },
                {
                    name: "மரிய வியாகப்பன் நாடார்",
                    children: [
                        { name: "ராஜமணி நாடார்" }
                    ]
                }
            ]
        }
    ]
};

function createNode(node) {
    const li = document.createElement("li");

    const div = document.createElement("div");
    div.textContent = node.name;

    li.appendChild(div);

    if (node.children && node.children.length) {
        const ul = document.createElement("ul");

        node.children.forEach(child => {
            ul.appendChild(createNode(child));
        });

        li.appendChild(ul);
    }

    return li;
}

const treeContainer = document.getElementById("tree");
treeContainer.className = "tree";

const ul = document.createElement("ul");
ul.appendChild(createNode(familyData));

treeContainer.appendChild(ul);
