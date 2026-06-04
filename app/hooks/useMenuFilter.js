import React, { useState, useEffect } from 'react';

const useMenuFilter = (initialProducts = []) =>{
    const [searchQuery, setSearchQuery] = useState(''); // טקסט החיפוש
    const [selectedCategory, setSelectedCategory] = useState('All'); // קטגוריה נבחרת ('All' = הכל)
    const [sortOrder, setSortOrder] = useState('default'); // סוג מיון: price_desc ..
    const [filteredProducts, setFilteredProducts] = useState([]); // הרשימה המסוננת שתמיד תוצג על המסך

    useEffect(() =>{
        let result = [...initialProducts];
        if(selectedCategory !== 'All')
            result = result.filter(product => product.category === selectedCategory);

        // חיפוש לפי טקסט תופס עברית ואנגלית כאחד
        if(searchQuery.trim() !== ''){
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(product => {
                const nameHe = product.name?.he?.toLowerCase() || '';
                const nameEn = product.name?.en?.toLowerCase() || '';
                return nameHe.includes(query) || nameEn.includes(query);
            });
        }

        // מיון לפי מחיר 
        if(sortOrder === 'price_asc')
            result.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
        else if(sortOrder === 'price_desc')
            result.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
        
        setFilteredProducts(result);

    } , [initialProducts, searchQuery, selectedCategory, sortOrder]);

    return{
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        sortOrder,
        setSortOrder,
        filteredProducts
    };

    

}

export default useMenuFilter;


